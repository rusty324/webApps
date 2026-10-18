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

  // ---- owned library -------------------------------------------------------

  function loadLibrary() {
    chrome.storage.local.get(['library', 'settings'], (data) => {
      const entries = (data.library && data.library.entries) || [];
      debug = !!(data.settings && data.settings.debug);
      index = new NS.OwnedIndex(entries);
      log(`loaded ${index.size} owned titles`);
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
    if (e.source !== window || !e.data || e.data.__libbyOwned !== 'media' || !Array.isArray(e.data.items)) return;
    for (const item of e.data.items) {
      if (item && typeof item.id === 'string' && typeof item.title === 'string') addMedia(item);
    }
    log(`captured ${e.data.items.length} title(s) from ${e.data.url} (total ${media.size})`);
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
    let badged = 0;
    for (const [host, texts] of hosts) {
      const whole = (host.textContent || '').trim();
      if (whole.length <= MAX_TEXT) texts.add(whole);
      let found = null;
      for (const t of texts) if ((found = matchText(t, host)) && found.result) break;
      if (applyBadge(host, found)) badged++;
    }
    log(`scan: ${hosts.size} text elements, ${badged} badge(s), ${media.size} captured titles`);
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
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    loadLibrary();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
