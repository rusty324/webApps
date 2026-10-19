// Runs in the page's MAIN world at document_start. Wraps fetch and XHR so we
// can read the JSON Libby receives from OverDrive's APIs (thunder, sentry, ...)
// and forward compact title records to the isolated content script.
(function () {
  'use strict';
  if (window.__libbyOwnedHooked) return;
  window.__libbyOwnedHooked = true;

  const HOST_RE = /(^|\.)(overdrive\.com|libbyapp\.com)$/i;
  const MAX_NODES = 50000;

  function names(list) {
    return list.map((c) => c && (c.name || c.fullName)).filter((n) => typeof n === 'string' && n.trim());
  }

  function mediaType(obj) {
    const t = obj.type;
    let id = (t && typeof t === 'object' ? t.id || t.name : t) || obj.mediaType || '';
    id = String(id).toLowerCase();
    if (!id && Array.isArray(obj.formats)) {
      const f = obj.formats.map((x) => String((x && x.id) || '')).join(' ');
      if (/audiobook/.test(f)) id = 'audiobook';
      else if (/ebook/.test(f)) id = 'ebook';
    }
    if (/audio/.test(id)) return 'audiobook';
    if (/ebook|book/.test(id)) return 'ebook';
    return id || null;
  }

  // Turn an object that looks like an OverDrive media record into a title record.
  function toRecord(obj) {
    if (typeof obj.title !== 'string' || !obj.title.trim()) return null;
    if (obj.id == null && obj.titleId == null) return null;
    const hasCreators = Array.isArray(obj.creators);
    if (!hasCreators && typeof obj.firstCreatorName !== 'string' && typeof obj.author !== 'string') return null;
    const type = mediaType(obj);
    if (type === 'magazine' || type === 'video') return null;
    let authors = [];
    let narrators = [];
    if (hasCreators) {
      const role = (c) => String((c && c.role) || '').toLowerCase();
      authors = names(obj.creators.filter((c) => role(c) === 'author'));
      if (!authors.length) authors = names(obj.creators.filter((c) => /editor|creator/.test(role(c))));
      narrators = names(obj.creators.filter((c) => /narrator|reader|performer/.test(role(c))));
    }
    if (!authors.length) {
      const first = obj.firstCreatorName || obj.author;
      if (typeof first === 'string' && first.trim()) authors = [first];
    }
    return {
      id: String(obj.id != null ? obj.id : obj.titleId),
      title: obj.title,
      subtitle: typeof obj.subtitle === 'string' ? obj.subtitle : '',
      type,
      authors,
      narrators,
    };
  }

  function extract(json) {
    const out = [];
    const stack = [json];
    let seen = 0;
    while (stack.length && seen < MAX_NODES) {
      const node = stack.pop();
      seen++;
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node)) {
        for (const v of node) if (v && typeof v === 'object') stack.push(v);
        continue;
      }
      const rec = toRecord(node);
      if (rec) out.push(rec);
      for (const k in node) {
        const v = node[k];
        if (v && typeof v === 'object') stack.push(v);
      }
    }
    return out;
  }

  // Keep what we've seen so the content script can ask for a replay if it
  // starts listening after Libby's first requests.
  const seenById = new Map();

  // Short, privacy-safe description of a request for diagnostics: host plus
  // the first two path segments with long numbers (card/loan ids) masked.
  function describeUrl(url) {
    try {
      const u = new URL(url, location.href);
      const path = u.pathname.split('/').slice(0, 3).join('/').replace(/\d{3,}/g, '#');
      return u.hostname + path;
    } catch (e) {
      return String(url).slice(0, 60);
    }
  }

  function report(url, info) {
    window.postMessage({ __libbyOwned: 'request', url: describeUrl(url), ...info }, location.origin);
  }

  function handle(json, url) {
    const items = extract(json);
    const keys = json && typeof json === 'object' && !Array.isArray(json) ? Object.keys(json).slice(0, 12) : ['[array]'];
    report(url, { json: true, items: items.length, keys });
    if (!items.length) return;
    for (const it of items) seenById.set(it.id, it);
    window.postMessage({ __libbyOwned: 'media', items, url: String(url) }, location.origin);
  }

  window.addEventListener('message', (e) => {
    if (e.source === window && e.data && e.data.__libbyOwned === 'replay') {
      window.postMessage({ __libbyOwned: 'hook-alive' }, location.origin);
      if (seenById.size) window.postMessage({ __libbyOwned: 'media', items: [...seenById.values()], url: 'replay' }, location.origin);
    }
  });
  window.postMessage({ __libbyOwned: 'hook-alive' }, location.origin);

  function isInteresting(url) {
    try {
      return HOST_RE.test(new URL(url, location.href).hostname);
    } catch (e) {
      return false;
    }
  }

  function handleText(text, url) {
    if (text && /^\s*[[{]/.test(text)) {
      try {
        handle(JSON.parse(text), url);
        return;
      } catch (e) {
        /* not JSON */
      }
    }
    report(url, { json: false });
  }

  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (input) {
      const p = origFetch.apply(this, arguments);
      p.then((res) => {
        try {
          const url = res.url || (input && input.url) || String(input);
          if (!isInteresting(url)) return report(url, { skipped: true });
          res.clone().text().then((t) => handleText(t, url), () => {});
        } catch (e) {
          /* never break the page */
        }
      }, () => {});
      return p;
    };
  }

  const XHR = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
  if (XHR) {
    const origOpen = XHR.open;
    const origSend = XHR.send;
    XHR.open = function (method, url) {
      this.__libbyOwnedUrl = url;
      return origOpen.apply(this, arguments);
    };
    XHR.send = function () {
      const url = this.__libbyOwnedUrl;
      if (!isInteresting(url)) report(url, { skipped: true, xhr: true });
      else {
        this.addEventListener('load', () => {
          try {
            if (this.responseType === 'json') handle(this.response, this.responseURL || url);
            else if (this.responseType === '' || this.responseType === 'text') handleText(this.responseText, this.responseURL || url);
            else report(url, { json: false, responseType: this.responseType });
          } catch (e) {
            /* ignore */
          }
        });
      }
      return origSend.apply(this, arguments);
    };
  }
})();
