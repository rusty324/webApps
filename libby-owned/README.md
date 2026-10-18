# Libby Owned

Chrome extension that marks titles on [libbyapp.com](https://libbyapp.com) that are already in your own library, using a CSV or JSON list you import.

| Badge | Meaning |
| --- | --- |
| ✓ **Owned** (green) | You own this title in this format. For audiobooks, the narrator matches too (or one side has no narrator info). |
| ≈ **Own other narrator** (amber) | You own an audiobook of this title, but a different recording. |
| ◐ **Own audiobook** / **Own as book** (blue) | You own the title, but in the other format. |

Hover a badge to see which of your entries matched.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this `libby-owned` folder.
3. The import page opens automatically. You can reopen it later from the toolbar button.
4. Import your list, then reload any open Libby tabs.

## Your list

CSV (comma, semicolon or tab separated) with a header row, or JSON (an array of objects, or an object containing one). Header and key names are matched loosely:

- **Title** (required): `title`, `book title`, `name`
- **Author**: `author`, `authors`, `written by`, plus `additional authors`
- **Narrator**: `narrator`, `narrators`, `narrated by`, `read by`
- **Format** (optional): `format`, `type`, `binding`. Anything containing "audio" counts as an audiobook; anything else counts as a book.

Without a format column, a row with a narrator is an audiobook, and a row without one is a book. Separate multiple people with `;`, `&` or `and`. "Last, First" is understood for single-word surnames. See `sample/sample-library.csv`.

The list is stored only in this browser, in `chrome.storage.local`.

## How it works

- `src/content/page-hook.js` runs in the page and reads the JSON Libby receives from OverDrive's APIs (`*.overdrive.com`, `libbyapp.com`). From each response it keeps every record that has a title, an id and creators. That gives the exact title, format, authors and narrators, with no dependence on Libby's markup.
- `src/content/content.js` finds page text equal to a captured title. It works out which record that text belongs to from the nearest link or data attribute holding the title id, or from the page URL, and adds a badge after it.
- **Fallback:** when no API record exists for some text, the text has to equal a title in your list exactly, and one of that book's authors has to be named in the same card.
- **Matching** (`src/core/match.js`):
  - Authors are compared by surname.
  - Titles are normalized: case, punctuation and accents are ignored, bracketed series notes are dropped, and so are "A Novel", "Unabridged" and leading articles.
  - "Title" matches "Title: Subtitle". Two different subtitles under the same main title do not match.
  - Small spelling differences are tolerated (bigram similarity ≥ 0.9), but differing numbers never match.
  - Narrators match on first initial + surname.

## Limitations

- This was built without access to the live Libby site, so the API capture and badge placement are untested against real Libby pages. If badges are missing or misplaced, turn on **Debug logging** on the import page and check the Libby tab's console (filter "Libby Owned"). It reports how many titles were captured and badged.
- Libby updates can change both the API and the page structure.
- Desktop Chrome only. The Libby mobile apps can't run extensions.

## Development

```sh
npm test   # parser and matcher unit tests (Node 18+)
```
