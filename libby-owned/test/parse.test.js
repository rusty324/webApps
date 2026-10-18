const test = require('node:test');
const assert = require('node:assert/strict');
const NS = require('./load');

test('CSV with quotes, BOM, CRLF and inferred formats', () => {
  const csv = '﻿Title,Author,Narrator\r\n"Project Hail Mary","Weir, Andy",Ray Porter\r\n"Dune, Deluxe","Frank Herbert",\r\n';
  const { entries, stats } = NS.parseLibrary(csv, 'x.csv');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], { title: 'Project Hail Mary', authors: ['Andy Weir'], narrators: ['Ray Porter'], format: 'audiobook' });
  assert.equal(entries[1].title, 'Dune, Deluxe');
  assert.equal(entries[1].format, 'book');
  assert.deepEqual(stats, { rows: 2, audiobooks: 1, books: 1, skipped: 0 });
});

test('header aliases and explicit format column', () => {
  const csv = 'Book Title;Written By;Narrated By;Binding\nGood Omens;Terry Pratchett & Neil Gaiman;;Audible Audio\nCirce;Madeline Miller;;Kindle Edition\n';
  const { entries, columns } = NS.parseLibrary(csv, 'x.csv');
  assert.equal(columns.title, 'Book Title');
  assert.deepEqual(entries[0].authors, ['Terry Pratchett', 'Neil Gaiman']);
  assert.equal(entries[0].format, 'audiobook');
  assert.equal(entries[1].format, 'book');
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
  assert.equal(entries[0].format, 'audiobook');
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
