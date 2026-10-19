# Libby Owned

Chrome extension that marks titles on [libbyapp.com](https://libbyapp.com) that are already in your own library, using a CSV or JSON list you import.

| Badge | Meaning |
| --- | --- |
| ✓ **Owned** (green) | You own this title in this format. For audiobooks, the narrator matches too (or one side has no narrator info). |
| ≈ **Own other narrator** (amber) | You own an audiobook of this title, but a different recording. |
| ◐ **Own audiobook** / **Own physical** / **Own ebook + physical** … (blue) | You own the title, but not in the format Libby is showing. A physical copy does not count as owning the ebook. |

Hover a badge to see which of your entries matched, with their formats and status.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this `libby-owned` folder.
3. The import page opens automatically. You can reopen it later from the toolbar button.
4. Import your list, then reload any open Libby tabs. Chrome doesn't add the extension to tabs that were already open, and this applies after every extension update as well.

The toolbar icon shows how many badges are on the current Libby page.

## Your list

CSV (comma, semicolon or tab separated) with a header row, or JSON (an array of objects, or an object containing one). Header and key names are matched loosely:

- **Title** (required): `title`, `book title`, `name`
- **Author**: `author`, `authors`, `written by`, plus `additional authors`
- **Narrator**: `narrator`, `narrators`, `narrated by`, `read by`
- **Format(s)** (optional): `format`, `formats`, `type`, `binding`. This can be a list (`["physical", "ebook", "audio"]` or `ebook; audio`), meaning you own every format in it. Recognized values:
  - audiobook: audio, mp3, m4b, …
  - ebook: ebook, kindle, epub, …
  - physical: physical, print, paperback, hardcover, …
- **Status** (optional, shown in the tooltip): `status`, `shelf`.

Without a format column, a row with a narrator is an audiobook, and a row without one is a book of unspecified format (treated like an ebook). Rows with the same title and author are merged. Separate multiple people with `;`, `&` or `and`. "Last, First" is understood for single-word surnames. See `sample/sample-library.csv`.

The list is stored only in this browser, in `chrome.storage.local`.

## How it works

- `src/content/page-hook.js` runs in the page and reads the JSON Libby receives from OverDrive's APIs (`*.overdrive.com`, `libbyapp.com`). From each response it keeps every record that has a title, an id and creators. That gives the exact title, format, authors and narrators, with no dependence on Libby's markup.
- `src/content/content.js` finds page text equal to a captured title. It works out which record that text belongs to from the nearest link or data attribute holding the title id, or from the page URL, and adds a badge after it.
- **Fallback:** when no API record exists for some text, the text has to equal a title in your list exactly, and one of that book's authors has to be named in the same card.
- **Matching** (`src/core/match.js`):
  - Authors are compared by surname.
  - Titles are normalized: case, punctuation and accents are ignored, bracketed series notes are dropped, and so are "A Novel", "Unabridged" and leading articles.
  - "Title" matches "Title: Subtitle" only when the subtitle looks descriptive: it starts with "A"/"An" or has five or more words (*World War Z: An Oral History…*). A short subtitle, or one mentioning a volume, book, part or graphic novel, has to match exactly, so *Thrawn* doesn't match *Thrawn: Alliances*.
  - Small spelling differences are tolerated (bigram similarity ≥ 0.9), but differing numbers or Roman numerals never match.
  - Narrators match on first initial + surname.

## Limitations

- Libby isn't a documented API. If badges disappear or land in odd places, open the import page and check **Troubleshooting → Diagnostics from the last Libby visit**. It explains in plain language where things stopped (never ran on the page, no library, no book data found, no matches). **Copy diagnostics** gives you a report to share; review it first, because it includes titles visible on the page. **Debug logging** adds detailed output to the Libby tab's console (filter "Libby Owned").
- Libby updates can change both the API and the page structure.
- Desktop Chrome only. The Libby mobile apps can't run extensions.

## Development

```sh
npm test   # parser and matcher unit tests (Node 18+)
```
