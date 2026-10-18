// Parse an uploaded CSV / TSV / JSON book list into normalized entries:
//   { title, subtitle?, authors: string[], narrators: string[], formats: string[], status? }
// where formats holds any of 'audiobook', 'ebook', 'physical', or 'book' (a
// non-audio edition of unknown kind).
(function (root) {
  'use strict';
  const NS = (root.LibbyOwned = root.LibbyOwned || {});

  // Header aliases, in priority order. Compared after lowercasing and
  // stripping everything but letters/digits.
  const FIELD_ALIASES = {
    title: ['title', 'booktitle', 'name', 'book', 'bookname'],
    subtitle: ['subtitle'],
    author: ['author', 'authors', 'authorname', 'authors1', 'writer', 'writtenby', 'by', 'creator', 'creators', 'authorlf'],
    extraAuthors: ['additionalauthors', 'coauthors'],
    narrator: ['narrator', 'narrators', 'narratedby', 'reader', 'readby', 'performer', 'performers', 'narratorname'],
    format: ['format', 'formats', 'ownedformats', 'type', 'mediatype', 'media', 'binding', 'kind'],
    status: ['status', 'readstatus', 'readingstatus', 'exclusiveshelf', 'shelf'],
  };

  const FORMAT_PATTERNS = [
    ['audiobook', /audio|listen|mp3|m4b|aax|narrat|\bcd\b/],
    ['ebook', /e-?book|kindle|epub|pdf|digital|nook|kobo/],
    ['physical', /physical|print|paper|hardcover|hardback|mass market|library binding|board book/],
  ];
  const FORMAT_ORDER = ['audiobook', 'ebook', 'physical', 'book'];

  const headerKey = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, '');

  function detectDelimiter(text) {
    const firstLine = text.slice(0, text.search(/\r?\n|$/));
    const counts = { ',': 0, ';': 0, '\t': 0 };
    let inQuotes = false;
    for (const ch of firstLine) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (!inQuotes && ch in counts) counts[ch]++;
    }
    return Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a), ',');
  }

  // RFC 4180-ish CSV parser: quoted fields, doubled quotes, CRLF, BOM.
  function parseCsv(text, delimiter) {
    text = String(text).replace(/^﻿/, '');
    const delim = delimiter || detectDelimiter(text);
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === delim) {
        row.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else field += ch;
    }
    if (field !== '' || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  function resolveColumns(headers) {
    const keys = headers.map(headerKey);
    const map = {};
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      for (const alias of aliases) {
        const idx = keys.indexOf(alias);
        if (idx !== -1) {
          map[field] = headers[idx];
          break;
        }
      }
    }
    return map;
  }

  // A format cell may hold several formats: ["physical", "audio"] or "ebook; audio".
  function normalizeFormats(value, hasNarrator) {
    const parts = (Array.isArray(value) ? value : String(value == null ? '' : value).split(/[,;|/+]/))
      .map((v) => String(v == null ? '' : v).toLowerCase().trim())
      .filter(Boolean);
    const out = new Set();
    for (const v of parts) {
      const hit = FORMAT_PATTERNS.find(([, re]) => re.test(v));
      out.add(hit ? hit[0] : 'book');
    }
    if (!out.size) out.add(hasNarrator ? 'audiobook' : 'book');
    return FORMAT_ORDER.filter((f) => out.has(f));
  }

  function toEntry(rec, cols) {
    // JSON records may not all use the same key ("narrator" vs "narrators").
    const get = (f) => {
      if (cols[f] && rec[cols[f]] != null) return rec[cols[f]];
      if (!cols[f]) return undefined;
      const key = Object.keys(rec).find((k) => FIELD_ALIASES[f].includes(headerKey(k)) && rec[k] != null);
      return key ? rec[key] : undefined;
    };
    let title = get('title');
    if (title && typeof title === 'object' && !Array.isArray(title)) title = title.name || title.title;
    title = String(title == null ? '' : title).trim();
    if (!title) return null;
    const subtitle = String(get('subtitle') || '').trim();
    const authors = [...NS.splitNames(get('author')), ...NS.splitNames(get('extraAuthors'))];
    const narrators = NS.splitNames(get('narrator'));
    const entry = {
      title,
      authors: [...new Set(authors)],
      narrators: [...new Set(narrators)],
      formats: normalizeFormats(get('format'), narrators.length > 0),
    };
    if (subtitle) entry.subtitle = subtitle;
    const status = get('status');
    if (typeof status === 'string' && status.trim()) entry.status = status.trim();
    return entry;
  }

  function findRecordArray(json) {
    if (Array.isArray(json)) return json;
    if (json && typeof json === 'object') {
      for (const v of Object.values(json)) {
        if (Array.isArray(v) && v.some((x) => x && typeof x === 'object')) return v;
      }
    }
    return null;
  }

  // Returns { entries, stats: { rows, audiobooks, books, skipped }, columns, warnings }.
  function parseLibrary(text, filename) {
    const warnings = [];
    let records;
    let headers;
    const trimmed = String(text).replace(/^﻿/, '').trim();
    const looksJson = /\.json$/i.test(filename || '') || /^[[{]/.test(trimmed);
    if (looksJson) {
      let json;
      try {
        json = JSON.parse(trimmed);
      } catch (e) {
        throw new Error('Could not parse JSON: ' + e.message);
      }
      records = findRecordArray(json);
      if (!records) throw new Error('JSON must be an array of book objects (or an object containing one).');
      records = records.filter((r) => r && typeof r === 'object');
      headers = [...new Set(records.flatMap((r) => Object.keys(r)))];
    } else {
      const rows = parseCsv(trimmed);
      if (rows.length < 2) throw new Error('CSV needs a header row and at least one book.');
      headers = rows[0].map((h) => h.trim());
      records = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] == null ? '' : r[i]])));
    }

    const columns = resolveColumns(headers);
    if (!columns.title) throw new Error('No title column found. Headers seen: ' + headers.join(', '));
    if (!columns.author) warnings.push('No author column found; matching will be much less reliable.');

    // Rows with the same title and authors are merged (formats/narrators combined).
    const byKey = new Map();
    const skippedRows = [];
    records.forEach((rec, i) => {
      const e = toEntry(rec, columns);
      if (!e) {
        skippedRows.push(i + 2);
        return;
      }
      const key = NS.normalizeTitle(e.title + ' ' + (e.subtitle || '')) + '|' + e.authors.map(NS.surname).sort().join(',');
      const prev = byKey.get(key);
      if (!prev) byKey.set(key, e);
      else {
        prev.formats = FORMAT_ORDER.filter((f) => prev.formats.includes(f) || e.formats.includes(f));
        prev.narrators = [...new Set([...prev.narrators, ...e.narrators])];
      }
    });
    const entries = [...byKey.values()];
    const merged = records.length - skippedRows.length - entries.length;
    if (merged) warnings.push(`Merged ${merged} duplicate row(s) with the same title and author.`);
    if (skippedRows.length) warnings.push(`Skipped ${skippedRows.length} row(s) without a title (e.g. row ${skippedRows.slice(0, 5).join(', ')}).`);
    const noAuthor = entries.filter((e) => !e.authors.length).length;
    if (columns.author && noAuthor) warnings.push(`${noAuthor} book(s) have no author and can only be matched by title.`);

    const count = (f) => entries.filter((e) => e.formats.includes(f)).length;
    return {
      entries,
      columns,
      warnings,
      stats: {
        rows: records.length,
        titles: entries.length,
        audiobooks: count('audiobook'),
        ebooks: count('ebook'),
        physical: count('physical'),
        unspecified: count('book'),
        skipped: skippedRows.length,
      },
    };
  }

  Object.assign(NS, { parseCsv, parseLibrary, resolveColumns, normalizeFormats });
  if (typeof module === 'object' && module.exports) module.exports = NS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
