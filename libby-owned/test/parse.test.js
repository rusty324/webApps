const test = require('node:test');
const assert = require('node:assert/strict');
const NS = require('./load');

test('CSV with quotes, BOM, CRLF and inferred formats', () => {
  const csv = '﻿Title,Author,Narrator\r\n"Project Hail Mary","Weir, Andy",Ray Porter\r\n"Dune, Deluxe","Frank Herbert",\r\n';
  const { entries, stats } = NS.parseLibrary(csv, 'x.csv');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], { title: 'Project Hail Mary', authors: ['Andy Weir'], narrators: ['Ray Porter'], formats: ['audiobook'] });
  assert.equal(entries[1].title, 'Dune, Deluxe');
  assert.deepEqual(entries[1].formats, ['book']);
  assert.deepEqual(stats, { rows: 2, titles: 2, audiobooks: 1, ebooks: 0, physical: 0, unspecified: 1, skipped: 0 });
});

test('header aliases and explicit format column', () => {
  const csv = 'Book Title;Written By;Narrated By;Binding\nGood Omens;Terry Pratchett & Neil Gaiman;;Audible Audio\nCirce;Madeline Miller;;Kindle Edition\n';
  const { entries, columns } = NS.parseLibrary(csv, 'x.csv');
  assert.equal(columns.title, 'Book Title');
  assert.deepEqual(entries[0].authors, ['Terry Pratchett', 'Neil Gaiman']);
  assert.deepEqual(entries[0].formats, ['audiobook']);
  assert.deepEqual(entries[1].formats, ['ebook']);
});

test('Goodreads-style columns: Author preferred over Author l-f, plus Additional Authors', () => {
  const csv = 'Title,Author,Author l-f,Additional Authors\nThe Talisman,Stephen King,"King, Stephen",Peter Straub\n';
  const { entries } = NS.parseLibrary(csv, 'goodreads.csv');
  assert.deepEqual(entries[0].authors, ['Stephen King', 'Peter Straub']);
});

test('JSON: wrapped array, array values and object creators', () => {
  const json = JSON.stringify({ books: [
    { Title: 'Leviathan Wakes', authors: ['James S. A. Corey'], narrator: { name: 'Jefferson Mays' } },
    { title: '' },
  ] });
  const { entries, warnings } = NS.parseLibrary(json, 'lib.json');
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].narrators, ['Jefferson Mays']);
  assert.deepEqual(entries[0].formats, ['audiobook']);
  assert.match(warnings.join(' '), /Skipped 1/);
});

test('missing title column is an error', () => {
  assert.throws(() => NS.parseLibrary('foo,bar\n1,2\n', 'x.csv'), /No title column/);
});

test('splitNames', () => {
  assert.deepEqual(NS.splitNames('Tolkien, J.R.R.'), ['J.R.R. Tolkien']);
  assert.deepEqual(NS.splitNames('Ray Porter, Jane Doe'), ['Ray Porter', 'Jane Doe']);
  assert.deepEqual(NS.splitNames('Martin Luther King, Jr.'), ['Martin Luther King']);
  assert.deepEqual(NS.splitNames('A; B and C'), ['A', 'B', 'C']);
});

test('format lists, status and duplicate merging (JSON export shape)', () => {
  const json = JSON.stringify({ lastUpdatedOn: '2026-10-13', items: [
    { status: 'read', id: 1, title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', formats: ['physical', 'ebook', 'audio'], genre: ['Fantasy'] },
    { status: 'want', id: 2, title: 'Saga, Vol. 1', author: 'Brian K. Vaughan, Fiona Staples', formats: ['ebook'] },
    { status: 'want', id: 3, title: 'Holes', author: 'Louis Sachar', formats: ['physical'] },
    { status: 'read', id: 4, title: 'Holes', author: 'Louis Sachar', formats: ['audio'] },
  ] });
  const { entries, stats, columns, warnings } = NS.parseLibrary(json, 'my-library.json');
  assert.equal(columns.format, 'formats');
  assert.deepEqual(entries[0].formats, ['audiobook', 'ebook', 'physical']);
  assert.equal(entries[0].status, 'read');
  assert.deepEqual(entries[1].authors, ['Brian K. Vaughan', 'Fiona Staples']);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries[2].formats, ['audiobook', 'physical']);
  assert.match(warnings.join(' '), /Merged 1 duplicate/);
  assert.deepEqual(stats, { rows: 4, titles: 3, audiobooks: 2, ebooks: 2, physical: 2, unspecified: 0, skipped: 0 });
});

test('normalizeFormats', () => {
  assert.deepEqual(NS.normalizeFormats('Kindle Edition'), ['ebook']);
  assert.deepEqual(NS.normalizeFormats('Paperback'), ['physical']);
  assert.deepEqual(NS.normalizeFormats('Audible Audio'), ['audiobook']);
  assert.deepEqual(NS.normalizeFormats('ebook; audio'), ['audiobook', 'ebook']);
  assert.deepEqual(NS.normalizeFormats('', true), ['audiobook']);
  assert.deepEqual(NS.normalizeFormats(''), ['book']);
});

test('role suffixes are stripped from names', () => {
  assert.deepEqual(NS.splitNames('Andrzej Sapkowski, Danusia Stok - translator'), ['Andrzej Sapkowski', 'Danusia Stok']);
  assert.deepEqual(NS.splitNames('Jane Doe (Illustrator)'), ['Jane Doe']);
});

test('JSON records with mixed key names and narrator lists', () => {
  const json = JSON.stringify({ items: [
    { title: 'A', author: 'X Y', narrator: 'Jim Dale', formats: ['physical', 'audio'] },
    { title: 'B', author: 'X Y', narrators: ['Martin Jarvis', 'Full Cast'], formats: ['audio'] },
  ] });
  const { entries } = NS.parseLibrary(json, 'x.json');
  assert.deepEqual(entries[0].narrators, ['Jim Dale']);
  assert.deepEqual(entries[1].narrators, ['Martin Jarvis', 'Full Cast']);
});
