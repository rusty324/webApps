// Matching Libby titles against the owned library.
(function (root) {
  'use strict';
  const NS = (root.LibbyOwned = root.LibbyOwned || {});

  const FUZZY_THRESHOLD = 0.9;

  function digits(s) {
    return (s.match(/\d+/g) || []).join(' ');
  }

  // a, b: results of titleKeys(). Exact on full titles, or one side's main
  // title equal to the other's full title (subtitle present on one side only).
  // Never main == main alone: "Star Wars: Thrawn" must not match "Star Wars: Heir to the Empire".
  function titlesMatch(a, b) {
    for (const k of a.full) if (b.full.has(k)) return true;
    if (a.main && b.full.has(a.main)) return true;
    if (b.main && a.full.has(b.main)) return true;
    for (const x of a.full) {
      for (const y of b.full) {
        if (Math.min(x.length, y.length) < 6) continue;
        if (digits(x) !== digits(y)) continue; // "Book 2" vs "Book 3"
        if (NS.dice(x, y) >= FUZZY_THRESHOLD) return true;
      }
    }
    return false;
  }

  function people(names) {
    return (names || [])
      .map((n) => {
        const key = NS.personKey(n);
        return key ? { key, surname: NS.surname(n), single: !key.includes(' ') } : null;
      })
      .filter(Boolean);
  }

  function peopleOverlap(a, b) {
    return a.some((x) => b.some((y) => x.key === y.key || ((x.single || y.single) && x.surname === y.surname)));
  }

  function prepare(entry) {
    return {
      entry,
      keys: NS.titleKeys(entry.title, entry.subtitle),
      surnames: new Set(entry.authors.map(NS.surname).filter(Boolean)),
      narrators: people(entry.narrators),
    };
  }

  function describe(entry) {
    let s = entry.title;
    if (entry.authors.length) s += ' — ' + entry.authors.join(', ');
    if (entry.narrators.length) s += ' (narr. ' + entry.narrators.join(', ') + ')';
    return s + ' [' + entry.format + ']';
  }

  class OwnedIndex {
    constructor(entries) {
      this.items = (entries || []).map(prepare);
      this.bySurname = new Map();
      this.byTitleKey = new Map();
      this.noAuthor = [];
      const push = (map, k, v) => {
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(v);
      };
      for (const it of this.items) {
        if (it.surnames.size) for (const s of it.surnames) push(this.bySurname, s, it);
        else this.noAuthor.push(it);
        for (const k of it.keys.full) push(this.byTitleKey, k, it);
        if (it.keys.main && !it.keys.full.has(it.keys.main)) push(this.byTitleKey, it.keys.main, it);
      }
      // Precompute the surnames that appear in the library for DOM fallback checks.
      this.allSurnames = new Set(this.bySurname.keys());
    }

    get size() {
      return this.items.length;
    }

    // Owned items whose title (and, when known, author) match.
    findMatches({ title, subtitle, authors }) {
      const q = NS.titleKeys(title, subtitle);
      const qSurnames = (authors || []).map(NS.surname).filter(Boolean);
      let pool;
      if (qSurnames.length) {
        const set = new Set(this.noAuthor);
        for (const s of qSurnames) for (const it of this.bySurname.get(s) || []) set.add(it);
        pool = [...set];
      } else {
        // No author info: exact title keys only, fuzzy matching would be too loose.
        const set = new Set();
        for (const k of [...q.full, q.main]) for (const it of this.byTitleKey.get(k) || []) set.add(it);
        pool = [...set];
      }
      return pool.filter((it) => titlesMatch(q, it.keys));
    }

    // Owned items whose title exactly equals a piece of page text (DOM fallback).
    lookupTitleText(text) {
      const k = NS.normalizeTitle(text);
      return k ? this.byTitleKey.get(k) || [] : [];
    }

    // item: { title, subtitle?, type?: 'audiobook'|'ebook'|..., authors?, narrators? }
    // Returns null when not owned, else { status, label, detail, matches }.
    //   status: 'owned' | 'other-recording' | 'other-format'
    match(item) {
      return evaluate(item, this.findMatches(item));
    }
  }

  function evaluate(item, matches) {
    if (!matches.length) return null;
    const audio = matches.filter((m) => m.entry.format === 'audiobook');
    const books = matches.filter((m) => m.entry.format !== 'audiobook');
    const detail = matches.map((m) => describe(m.entry)).join('\n');
    const result = (status, label, ms) => ({ status, label, detail, matches: ms.map((m) => m.entry) });
    const type = item.type;

    if (type === 'audiobook') {
      if (!audio.length) return result('other-format', 'Own as book', books);
      const qn = people(item.narrators);
      if (!qn.length) return result('owned', 'Owned', audio);
      const same = audio.filter((m) => !m.narrators.length || peopleOverlap(m.narrators, qn));
      if (same.length) return result('owned', 'Owned', same);
      return result('other-recording', 'Own other narrator', audio);
    }
    if (type === 'ebook' || type === 'book') {
      if (books.length) return result('owned', 'Owned', books);
      return result('other-format', 'Own audiobook', audio);
    }
    // Unknown type (DOM fallback): report what is owned.
    const formats = [audio.length && 'audiobook', books.length && 'book'].filter(Boolean).join(' + ');
    return result('owned', 'Own ' + formats, matches);
  }

  Object.assign(NS, { OwnedIndex, titlesMatch, evaluate, describe });
  if (typeof module === 'object' && module.exports) module.exports = NS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
