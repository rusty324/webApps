// Text normalization for titles and person names.
// Shared by the options page, the content script and the Node tests.
(function (root) {
  'use strict';
  const NS = (root.LibbyOwned = root.LibbyOwned || {});

  // Words/phrases that publishers and stores tack onto titles.
  const TITLE_NOISE = /\b(a novel|a memoir|a thriller|unabridged|abridged|audiobook|audio edition|kindle edition|ebook edition|ebook|dramatized adaptation)\b/g;
  const LEADING_ARTICLE = /^(the|a|an) /;
  const NAME_SUFFIX = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'esq']);

  function basicNormalize(s) {
    return String(s == null ? '' : s)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/['‘’`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function normalizeTitle(s) {
    let t = String(s == null ? '' : s).replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');
    t = basicNormalize(t).replace(TITLE_NOISE, ' ').replace(/\s+/g, ' ').trim();
    t = t.replace(LEADING_ARTICLE, '');
    return t;
  }

  const SEPARATOR = /\s*:\s*|\s+[-–—]\s+/;

  // A subtitle that describes the book ("An Oral History of the Zombie War")
  // rather than naming a different one ("Alliances", "The Graphic Novel").
  function isDescriptiveSubtitle(tail) {
    const t = basicNormalize(tail);
    if (!t) return true;
    if (/graphic novel|comic|manga|\bvol(ume)?\b|\bbook\b|\bpart\b|\d/.test(t)) return false;
    return /^(a|an) /.test(t) || t.split(' ').length >= 5;
  }

  // Returns { full: Set, main } where `full` holds the normalized whole title
  // (title + subtitle) and `main` is the part before the first colon / dash.
  // `main` is null when the subtitle may name a different book (a sequel,
  // a graphic-novel edition), so only the whole title can match.
  function titleKeys(title, subtitle) {
    const raw = String(title == null ? '' : title).replace(/\([^)]*\)|\[[^\]]*\]/g, ' ');
    const sub = subtitle ? String(subtitle) : '';
    const full = new Set();
    const k = normalizeTitle(sub ? raw + ' ' + sub : raw);
    if (k) full.add(k);
    const sep = raw.search(SEPARATOR);
    const head = sep === -1 ? raw : raw.slice(0, sep);
    const tail = (sep === -1 ? '' : raw.slice(sep).replace(SEPARATOR, '')) + (sub ? ' ' + sub : '');
    const mainKey = normalizeTitle(head);
    const main = mainKey && (isDescriptiveSubtitle(tail) || /\d/.test(head)) ? mainKey : null;
    return { full, main };
  }

  function nameTokens(name) {
    return basicNormalize(name)
      .split(' ')
      .filter((t) => t && !NAME_SUFFIX.has(t));
  }

  function surname(name) {
    const toks = nameTokens(name);
    return toks.length ? toks[toks.length - 1] : '';
  }

  // "Ray Porter" and "R. Porter" both become "r porter".
  function personKey(name) {
    const toks = nameTokens(name);
    if (!toks.length) return '';
    if (toks.length === 1) return toks[0];
    return toks[0][0] + ' ' + toks[toks.length - 1];
  }

  // Split a cell like "Andy Weir; Jane Doe" or "Weir, Andy" into names.
  function splitNames(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(splitNames);
    if (typeof value === 'object') return splitNames(value.name || value.fullName || '');
    const s = String(value).trim();
    if (!s) return [];
    const parts = s
      .split(/\s*(?:;|&|\||\/|\band\b|\bwith\b)\s*/i)
      // "Ken Liu - translator", "Jane Doe (Illustrator)"
      .map((p) => p.replace(/\s*(?:[-–(]\s*)(?:translator|editor|illustrator|narrator|foreword|introduction)\)?\s*$/i, '').trim())
      .filter(Boolean);
    const out = [];
    for (const p of parts) {
      const commaParts = p.split(/\s*,\s*/).filter(Boolean);
      // "Weir, Andy" -> "Andy Weir" when the first piece is a single word.
      if (commaParts.length === 2 && !/\s/.test(commaParts[0]) && !NAME_SUFFIX.has(basicNormalize(commaParts[1]))) {
        out.push(commaParts[1] + ' ' + commaParts[0]);
      } else {
        for (const c of commaParts) if (!NAME_SUFFIX.has(basicNormalize(c))) out.push(c);
      }
    }
    return out;
  }

  // Sørensen–Dice similarity on character bigrams.
  function dice(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const grams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
      const g = a.slice(i, i + 2);
      grams.set(g, (grams.get(g) || 0) + 1);
    }
    let hits = 0;
    for (let i = 0; i < b.length - 1; i++) {
      const g = b.slice(i, i + 2);
      const n = grams.get(g);
      if (n) {
        hits++;
        grams.set(g, n - 1);
      }
    }
    return (2 * hits) / (a.length + b.length - 2);
  }

  Object.assign(NS, { basicNormalize, normalizeTitle, titleKeys, surname, personKey, splitNames, dice });
  if (typeof module === 'object' && module.exports) module.exports = NS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
