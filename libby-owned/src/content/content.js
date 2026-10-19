// Isolated-world content script: keeps the owned-library index, collects the
// title records forwarded by page-hook.js and badges matching titles on the page.
(function () {
  'use strict';
  const NS = globalThis.LibbyOwned;
  const BADGE_CLASS = 'libby-owned-badge';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'TITLE', 'SVG']);
  // Search results may wrap part of a title in highlight tags.
  const HIGHLIGHT_TAGS = new Set(['MARK', 'B', 'STRONG', 'EM', 'I', 'U']);
  const MAX_TEXT = 300;
  const ID_RE = /(?:^|[/=])(\d{4,})(?=$|[/?#&])/g;
  const ICONS = { owned: '✓', 'other-recording': '≈', 'other-format': '◐' };

  let index = new NS.OwnedIndex([]);
  let debug = false;
  const media = new Map(); // OverDrive title id -> record from page-hook
  const mediaByKey = new Map(); // normalized title -> Set of ids

  const log = (...a) => debug && console.log('[Libby Owned]', ...a);
  const VERSION = chrome.runtime.getManifest().version;
  console.info(`[Libby Owned] v${VERSION} content script running on ${location.href}`);

  // ---- diagnostics (shown on the options page, copied into bug reports) ----

  const diag = {
    version: VERSION,
    url: location.href,
    startedAt: new Date().toISOString(),
    hookAlive: false,
    libraryTitles: 0,
    captured: 0,
    scans: 0,
    lastScan: null,
    requests: {}, // "host/path" -> { n, json, items, keys }
    capturedSample: [],
    pageTextSample: [],
    errors: [],
  };
  let diagTimer = null;
  function saveDiag() {
    if (diagTimer) return;
    diagTimer = setTimeout(() => {
      diagTimer = null;
      diag.url = location.href;
      diag.savedAt = new Date().toISOString();
      try {
        chrome.storage.local.set({ diag });
      } catch (e) {
        /* extension reloaded; this tab's script is orphaned */
      }
    }, 1500);
  }
  function recordError(where, e) {
    console.error('[Libby Owned] ' + where, e);
    diag.errors.push(where + ': ' + (e && e.message ? e.message : String(e)));
    diag.errors = diag.errors.slice(-10);
    saveDiag();
  }

  // ---- owned library -------------------------------------------------------

  function loadLibrary() {
    chrome.storage.local.get(['library', 'settings'], (data) => {
      const entries = (data.library && data.library.entries) || [];
      debug = !!(data.settings && data.settings.debug);
      index = new NS.OwnedIndex(entries);
      diag.libraryTitles = index.size;
      console.info(`[Libby Owned] library: ${index.size} titles; debug logging ${debug ? 'on' : 'off'}`);
      if (!index.size) console.warn('[Libby Owned] no library imported; open the extension options to import one');
      saveDiag();
      clearBadges();
      scheduleScan();
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.library || changes.settings)) loadLibrary();
  });

  // ---- records from the page hook -----------------------------------------

  function addMedia(item) {
    media.set(item.id, item);
    const k = NS.titleKeys(item.title, item.subtitle);
    for (const key of [...k.full, k.main]) {
      if (!key) continue;
      if (!mediaByKey.has(key)) mediaByKey.set(key, new Set());
      mediaByKey.get(key).add(item.id);
    }
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || typeof e.data.__libbyOwned !== 'string') return;
    const d = e.data;
    if (d.__libbyOwned === 'hook-alive') {
      diag.hookAlive = true;
      return saveDiag();
    }
    if (d.__libbyOwned === 'request') {
      const r = (diag.requests[d.url] = diag.requests[d.url] || { n: 0 });
      r.n++;
      if (d.skipped) r.skipped = true;
      if (d.json != null) r.json = d.json;
      if (d.items != null) r.items = (r.items || 0) + d.items;
      if (d.keys) r.keys = d.keys;
      const urls = Object.keys(diag.requests);
      if (urls.length > 60) delete diag.requests[urls[0]];
      return saveDiag();
    }
    if (d.__libbyOwned !== 'media' || !Array.isArray(d.items)) return;
    for (const item of d.items) {
      if (item && typeof item.id === 'string' && typeof item.title === 'string') addMedia(item);
    }
    diag.captured = media.size;
    for (const item of d.items.slice(0, 8 - diag.capturedSample.length)) {
      diag.capturedSample.push({ id: item.id, title: item.title, type: item.type, authors: item.authors, narrators: item.narrators });
    }
    log(`captured ${d.items.length} title(s) from ${d.url} (total ${media.size})`);
    saveDiag();
    scheduleScan();
  });
  window.postMessage({ __libbyOwned: 'replay' }, location.origin);

  // ---- DOM scanning --------------------------------------------------------

  function idsIn(str, ids) {
    if (!str) return null;
    ID_RE.lastIndex = 0;
    let m;
    while ((m = ID_RE.exec(str))) if (ids.has(m[1])) return m[1];
    return null;
  }

  function idOnElement(el, ids) {
    for (const attr of el.attributes) {
      if (attr.name === 'href' || attr.name.startsWith('data-')) {
        const id = idsIn(attr.value, ids);
        if (id) return id;
      }
    }
    return null;
  }

  // Figure out which captured record a title element belongs to: nearest link
  // or data attribute carrying a title id, then the URL of the current page.
  function resolveItem(host, ids) {
    let el = host;
    for (let depth = 0; el && el !== document.body && depth < 8; depth++, el = el.parentElement) {
      let id = idOnElement(el, ids);
      if (!id) {
        const links = el.querySelectorAll('a[href], [data-id], [data-title-id], [data-media-id]');
        for (let i = 0; i < links.length && i < 6 && !id; i++) id = idOnElement(links[i], ids);
      }
      if (id) return media.get(id);
    }
    const pageId = idsIn(location.pathname, ids);
    if (pageId) return media.get(pageId);
    if (ids.size === 1) return media.get([...ids][0]);
    return null;
  }

  // Text of an element with its text nodes joined by spaces (textContent would
  // glue "Circe" and "Madeline Miller" from sibling elements together).
  function spacedText(el) {
    const parts = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.parentElement.closest('.' + BADGE_CLASS)) parts.push(n.nodeValue);
    }
    return ' ' + NS.basicNormalize(parts.join(' ')) + ' ';
  }

  // Is one of the owned authors named near the title? Climb from the title
  // element, but stop once an ancestor contains the title twice: that means
  // we've left this card and reached a list of several.
  function authorNearby(host, titleKey, surnames) {
    let el = host.parentElement;
    for (let i = 0; i < 5 && el && el !== document.body; i++, el = el.parentElement) {
      if ((el.textContent || '').length > 800) return false;
      const text = spacedText(el);
      if (text.split(' ' + titleKey + ' ').length > 2) return false;
      if (surnames.some((s) => text.includes(' ' + s + ' '))) return true;
    }
    return false;
  }

  function matchText(text, host) {
    const key = NS.normalizeTitle(text);
    if (!key) return null;
    const ids = mediaByKey.get(key);
    if (ids && ids.size) {
      const item = resolveItem(host, ids);
      if (item) return { result: index.match(item), sig: 'id:' + item.id };
      // Same title in several formats and we can't tell which one this is.
      const first = media.get([...ids][0]);
      return { result: index.match({ title: first.title, subtitle: first.subtitle, authors: first.authors, type: null }), sig: 't:' + key };
    }
    // Fallback when nothing was captured from the API: exact title + author surname nearby.
    const entries = index.lookupTitleText(text);
    if (!entries.length) return null;
    const titleKey = NS.basicNormalize(text);
    const ok = entries.filter((it) => !it.surnames.size || authorNearby(host, titleKey, [...it.surnames]));
    return ok.length ? { result: NS.evaluate({ type: null }, ok), sig: 'dom:' + key } : null;
  }

  function applyBadge(host, found) {
    const next = host.nextElementSibling;
    const existing = next && next.classList.contains(BADGE_CLASS) ? next : null;
    const result = found && found.result;
    if (!result) {
      if (existing) existing.remove();
      return false;
    }
    const sig = found.sig + '|' + result.status + '|' + result.label;
    if (existing && existing.dataset.sig === sig) return true;
    const badge = existing || document.createElement('span');
    badge.className = BADGE_CLASS + ' ' + BADGE_CLASS + '--' + result.status;
    badge.dataset.sig = sig;
    badge.textContent = ICONS[result.status] + ' ' + result.label;
    badge.title = 'In your library:\n' + result.detail;
    if (!existing) host.insertAdjacentElement('afterend', badge);
    return true;
  }

  function scan() {
    try {
      scanInner();
    } catch (e) {
      recordError('scan', e);
    }
  }

  function scanInner() {
    if (!document.body) return;
    if (!index.size) return;
    const hosts = new Map(); // host element -> candidate texts
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const t = n.nodeValue;
        if (!t || t.length > MAX_TEXT || t.trim().length < 2) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || SKIP_TAGS.has(p.tagName.toUpperCase()) || p.closest('.' + BADGE_CLASS)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      let host = n.parentElement;
      if (HIGHLIGHT_TAGS.has(host.tagName) && host.parentElement) host = host.parentElement;
      if (!hosts.has(host)) hosts.set(host, new Set());
      hosts.get(host).add(n.nodeValue.trim());
    }
    if (diag.pageTextSample.length < 40) {
      for (const texts of hosts.values()) {
        for (const t of texts) if (t.length >= 3 && t.length <= 80 && diag.pageTextSample.length < 40) diag.pageTextSample.push(t);
      }
    }
    let badged = 0;
    for (const [host, texts] of hosts) {
      const whole = (host.textContent || '').trim();
      if (whole.length <= MAX_TEXT) texts.add(whole);
      let found = null;
      for (const t of texts) if ((found = matchText(t, host)) && found.result) break;
      if (applyBadge(host, found)) badged++;
    }
    log(`scan: ${hosts.size} text elements, ${badged} badge(s), ${media.size} captured titles`);
    diag.scans++;
    diag.lastScan = { textElements: hosts.size, badges: badged, at: new Date().toISOString() };
    saveDiag();
    try {
      chrome.runtime.sendMessage({ type: 'badges', count: badged }, () => void chrome.runtime.lastError);
    } catch (e) {
      /* orphaned after extension reload */
    }
  }

  function clearBadges() {
    document.querySelectorAll('.' + BADGE_CLASS).forEach((b) => b.remove());
  }

  let timer = null;
  function scheduleScan() {
    clearTimeout(timer);
    timer = setTimeout(scan, 300);
  }

  const isOurs = (node) => node.nodeType === 1 && node.classList.contains(BADGE_CLASS);
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        const nodes = [...m.addedNodes, ...m.removedNodes];
        if (nodes.length && nodes.every(isOurs)) continue;
      }
      if (m.target.nodeType === 1 && isOurs(m.target)) continue;
      scheduleScan();
      return;
    }
  });

  function start() {
    try {
      observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
      loadLibrary();
    } catch (e) {
      recordError('start', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
