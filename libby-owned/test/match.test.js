const test = require('node:test');
const assert = require('node:assert/strict');
const NS = require('./load');

const owned = new NS.OwnedIndex([
  { title: 'Project Hail Mary: A Novel', authors: ['Andy Weir'], narrators: ['Ray Porter'], format: 'audiobook' },
  { title: "Harry Potter and the Sorcerer's Stone (Harry Potter, Book 1)", authors: ['J.K. Rowling'], narrators: ['Jim Dale'], format: 'audiobook' },
  { title: 'The Name of the Wind', authors: ['Patrick Rothfuss'], narrators: [], format: 'book' },
  { title: 'Star Wars: Thrawn', authors: ['Timothy Zahn'], narrators: [], format: 'book' },
  { title: 'The Expanse 2', authors: ['Some Author'], narrators: [], format: 'book' },
  { title: 'Leviathan Wakes', authors: ['James S. A. Corey'], narrators: ['Jefferson Mays'], format: 'audiobook' },
  { title: 'Leviathan Wakes', authors: ['James S. A. Corey'], narrators: [], format: 'book' },
]);

test('audiobook with matching narrator is owned (subtitle/noise ignored)', () => {
  const r = owned.match({ title: 'Project Hail Mary', type: 'audiobook', authors: ['Andy Weir'], narrators: ['Ray Porter'] });
  assert.equal(r.status, 'owned');
});

test('narrator initials still match', () => {
  const r = owned.match({ title: 'Project Hail Mary', type: 'audiobook', authors: ['Andy Weir'], narrators: ['R. Porter'] });
  assert.equal(r.status, 'owned');
});

test('different narrator is flagged as other recording', () => {
  const r = owned.match({ title: "Harry Potter and the Sorcerer's Stone", type: 'audiobook', authors: ['J. K. Rowling'], narrators: ['Stephen Fry'] });
  assert.equal(r.status, 'other-recording');
});

test('ebook on Libby when only the audiobook is owned', () => {
  const r = owned.match({ title: 'Project Hail Mary', type: 'ebook', authors: ['Andy Weir'] });
  assert.equal(r.status, 'other-format');
  assert.equal(r.label, 'Own audiobook');
});

test('audiobook on Libby when only the book is owned', () => {
  const r = owned.match({ title: 'The Name of the Wind', type: 'audiobook', authors: ['Patrick Rothfuss'], narrators: ['Nick Podehl'] });
  assert.equal(r.status, 'other-format');
});

test('owning both formats matches the right one', () => {
  assert.equal(owned.match({ title: 'Leviathan Wakes', type: 'ebook', authors: ['James S. A. Corey'] }).status, 'owned');
  assert.equal(owned.match({ title: 'Leviathan Wakes', type: 'audiobook', authors: ['James S. A. Corey'], narrators: ['Jefferson Mays'] }).status, 'owned');
});

test('shared main title with different subtitles does not match', () => {
  assert.equal(owned.match({ title: 'Star Wars: Heir to the Empire', type: 'ebook', authors: ['Timothy Zahn'] }), null);
  assert.equal(owned.match({ title: 'Star Wars', subtitle: 'Thrawn', type: 'ebook', authors: ['Timothy Zahn'] }).status, 'owned');
});

test('fuzzy matching tolerates small differences but not series numbers', () => {
  assert.equal(owned.match({ title: 'The Name of The Wind!', type: 'ebook', authors: ['Patrick Rothfuss'] }).status, 'owned');
  assert.equal(owned.match({ title: 'Name of the Winds', type: 'ebook', authors: ['Patrick Rothfuss'] }).status, 'owned');
  assert.equal(owned.match({ title: 'The Expanse 3', type: 'ebook', authors: ['Some Author'] }), null);
});

test('same title by a different author does not match', () => {
  assert.equal(owned.match({ title: 'Project Hail Mary', type: 'audiobook', authors: ['Someone Else'] }), null);
});

test('unknown type reports formats owned', () => {
  const r = owned.match({ title: 'Leviathan Wakes', type: null, authors: ['James S. A. Corey'] });
  assert.equal(r.label, 'Own audiobook + book');
});

test('DOM fallback title lookup', () => {
  assert.equal(owned.lookupTitleText('Project Hail Mary').length, 1);
  assert.equal(owned.lookupTitleText('Andy Weir').length, 0);
});
