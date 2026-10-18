const test = require('node:test');
const assert = require('node:assert/strict');
const NS = require('./load');

const owned = new NS.OwnedIndex([
  { title: 'Project Hail Mary: A Novel', authors: ['Andy Weir'], narrators: ['Ray Porter'], formats: ['audiobook'] },
  { title: "Harry Potter and the Sorcerer's Stone (Harry Potter, Book 1)", authors: ['J.K. Rowling'], narrators: ['Jim Dale'], formats: ['audiobook'] },
  { title: 'The Name of the Wind', authors: ['Patrick Rothfuss'], narrators: [], formats: ['ebook'] },
  { title: 'Star Wars: Thrawn', authors: ['Timothy Zahn'], narrators: [], formats: ['ebook'] },
  { title: 'The Expanse 2', authors: ['Some Author'], narrators: [], formats: ['ebook'] },
  { title: 'Leviathan Wakes', authors: ['James S. A. Corey'], narrators: ['Jefferson Mays'], formats: ['audiobook'] },
  { title: 'Leviathan Wakes', authors: ['James S. A. Corey'], narrators: [], formats: ['ebook'] },
  { title: 'A Court of Mist and Fury', authors: ['Sarah J. Maas'], narrators: [], formats: ['physical', 'audiobook'], status: 'want' },
  { title: 'Holes', authors: ['Louis Sachar'], narrators: [], formats: ['physical'] },
  { title: 'Old Entry', authors: ['Legacy Writer'], narrators: [], format: 'book' },
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
  assert.equal(r.label, 'Own audiobook + ebook');
});

test('DOM fallback title lookup', () => {
  assert.equal(owned.lookupTitleText('Project Hail Mary').length, 1);
  assert.equal(owned.lookupTitleText('Andy Weir').length, 0);
});

test('multi-format entry: audiobook owned, ebook only physical', () => {
  const a = owned.match({ title: 'A Court of Mist and Fury', type: 'audiobook', authors: ['Sarah J. Maas'], narrators: ['Amanda Leigh Cobb'] });
  assert.equal(a.status, 'owned');
  assert.match(a.detail, /\[physical, audiobook\] · want/);
  const e = owned.match({ title: 'A Court of Mist and Fury', type: 'ebook', authors: ['Sarah J. Maas'] });
  assert.equal(e.status, 'other-format');
  assert.equal(e.label, 'Own audiobook + physical');
});

test('physical-only book on Libby', () => {
  assert.equal(owned.match({ title: 'Holes', type: 'ebook', authors: ['Louis Sachar'] }).label, 'Own physical');
  assert.equal(owned.match({ title: 'Holes', type: 'audiobook', authors: ['Louis Sachar'] }).label, 'Own physical');
});

test('legacy single-format entries still work', () => {
  assert.equal(owned.match({ title: 'Old Entry', type: 'ebook', authors: ['Legacy Writer'] }).status, 'owned');
});

test('sequels, graphic novels and numbered entries are not the same book', () => {
  const idx = new NS.OwnedIndex([
    { title: 'Thrawn', authors: ['Timothy Zahn'], narrators: [], formats: ['ebook'] },
    { title: 'The Way of Shadows', authors: ['Brent Weeks'], narrators: [], formats: ['ebook'] },
    { title: 'The Force Unleashed', authors: ['Sean Williams'], narrators: [], formats: ['ebook'] },
    { title: 'World War Z', authors: ['Max Brooks'], narrators: [], formats: ['ebook'] },
    { title: 'One-Punch Man, Vol. 01: One Punch', authors: ['ONE'], narrators: [], formats: ['ebook'] },
  ]);
  const m = (title, author, subtitle) => idx.match({ title, subtitle, authors: [author], type: 'ebook' });
  assert.equal(m('Thrawn: Alliances', 'Timothy Zahn'), null);
  assert.equal(m('Thrawn', 'Timothy Zahn', 'Treason'), null);
  assert.equal(m('The Way of Shadows: The Graphic Novel', 'Brent Weeks'), null);
  assert.equal(m('The Force Unleashed II', 'Sean Williams'), null);
  assert.equal(m('World War Z: An Oral History of the Zombie War', 'Max Brooks').status, 'owned');
  assert.equal(m('World War Z', 'Max Brooks', 'An Oral History of the Zombie War').status, 'owned');
  assert.equal(m('One-Punch Man, Vol. 01', 'ONE').status, 'owned');
});
