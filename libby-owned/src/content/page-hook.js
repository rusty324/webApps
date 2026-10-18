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

  function handle(json, url) {
    const items = extract(json);
    if (!items.length) return;
    for (const it of items) seenById.set(it.id, it);
    window.postMessage({ __libbyOwned: 'media', items, url: String(url) }, location.origin);
  }

  window.addEventListener('message', (e) => {
    if (e.source === window && e.data && e.data.__libbyOwned === 'replay' && seenById.size) {
      window.postMessage({ __libbyOwned: 'media', items: [...seenById.values()], url: 'replay' }, location.origin);
    }
  });

  function isInteresting(url) {
    try {
      return HOST_RE.test(new URL(url, location.href).hostname);
    } catch (e) {
      return false;
    }
  }

  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (input) {
      const p = origFetch.apply(this, arguments);
      p.then((res) => {
        try {
          const url = res.url || (input && input.url) || String(input);
          const ct = res.headers.get('content-type') || '';
          if (isInteresting(url) && /json/i.test(ct)) {
            res.clone().json().then((j) => handle(j, url), () => {});
          }
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
      if (isInteresting(this.__libbyOwnedUrl)) {
        this.addEventListener('load', () => {
          try {
            let j = null;
            if (this.responseType === 'json') j = this.response;
            else if (this.responseType === '' || this.responseType === 'text') {
              const t = this.responseText;
              if (t && /^\s*[[{]/.test(t)) j = JSON.parse(t);
            }
            if (j) handle(j, this.responseURL || this.__libbyOwnedUrl);
          } catch (e) {
            /* ignore */
          }
        });
      }
      return origSend.apply(this, arguments);
    };
  }
})();
