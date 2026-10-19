(function () {
  'use strict';
  const NS = globalThis.LibbyOwned;
  const PAGE_SIZE = 200;
  const $ = (id) => document.getElementById(id);

  let library = null;
  let index = new NS.OwnedIndex([]);

  function render() {
    const entries = (library && library.entries) || [];
    index = new NS.OwnedIndex(entries);
    if (!library) {
      $('status').textContent = 'No library imported yet.';
    } else {
      const s = library.stats;
      const when = new Date(library.importedAt).toLocaleString();
      const parts = [
        [s.audiobooks, 'audiobook'],
        [s.ebooks, 'ebook'],
        [s.physical, 'physical'],
        [s.unspecified != null ? s.unspecified : s.books, 'unspecified format'],
      ]
        .filter(([n]) => n)
        .map(([n, label]) => `${n} ${label}`);
      $('status').textContent = `${entries.length} titles (${parts.join(', ')}) from ${library.sourceName}, imported ${when}.`;
    }
    renderRows();
  }

  function renderRows() {
    const entries = (library && library.entries) || [];
    const q = NS.basicNormalize($('filter').value);
    const hits = q
      ? entries.filter((e) => NS.basicNormalize([e.title, ...e.authors, ...e.narrators].join(' ')).includes(q))
      : entries;
    const body = $('rows');
    body.textContent = '';
    for (const e of hits.slice(0, PAGE_SIZE)) {
      const tr = document.createElement('tr');
      for (const v of [e.title + (e.subtitle ? ': ' + e.subtitle : ''), e.authors.join(', '), e.narrators.join(', '), (e.formats || [e.format]).join(', ')]) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    $('more').textContent = hits.length > PAGE_SIZE ? `Showing ${PAGE_SIZE} of ${hits.length}. Use the filter to narrow down.` : '';
  }

  function showMessages(lines) {
    const ul = $('warnings');
    ul.textContent = '';
    for (const { text, ok } of lines) {
      const li = document.createElement('li');
      li.textContent = text;
      if (ok) li.className = 'ok';
      ul.appendChild(li);
    }
    $('result').hidden = !lines.length;
  }

  async function importFile(file) {
    let parsed;
    try {
      parsed = NS.parseLibrary(await file.text(), file.name);
    } catch (e) {
      showMessages([{ text: e.message }]);
      return;
    }
    const cols = Object.entries(parsed.columns)
      .map(([field, header]) => `${field} ← “${header}”`)
      .join(', ');
    library = { entries: parsed.entries, stats: parsed.stats, sourceName: file.name, importedAt: Date.now() };
    chrome.storage.local.set({ library }, () => {
      if (chrome.runtime.lastError) {
        showMessages([{ text: 'Saving failed: ' + chrome.runtime.lastError.message }]);
        return;
      }
      showMessages([{ text: 'Columns used: ' + cols, ok: true }, ...parsed.warnings.map((text) => ({ text }))]);
      render();
    });
  }

  $('file').addEventListener('change', (e) => {
    if (e.target.files[0]) importFile(e.target.files[0]);
    e.target.value = '';
  });
  const drop = $('drop');
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    if (e.dataTransfer.files[0]) importFile(e.dataTransfer.files[0]);
  });

  $('clear').addEventListener('click', () => {
    if (!library || !confirm('Remove the imported library from this browser?')) return;
    chrome.storage.local.remove('library', () => {
      library = null;
      showMessages([]);
      render();
    });
  });

  $('filter').addEventListener('input', renderRows);

  $('test').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const res = index.match({
      title: f.get('title'),
      authors: NS.splitNames(f.get('author')),
      narrators: NS.splitNames(f.get('narrator')),
      type: f.get('type') || null,
    });
    const out = $('testResult');
    out.textContent = '';
    if (!res) {
      out.textContent = 'No badge: not found in your library.';
      return;
    }
    const pill = document.createElement('span');
    pill.className = 'pill ' + res.status;
    pill.textContent = res.label;
    out.append(pill, '\n' + res.detail);
  });

  $('debug').addEventListener('change', (e) => {
    chrome.storage.local.get('settings', (d) => {
      chrome.storage.local.set({ settings: Object.assign({}, d.settings, { debug: e.target.checked }) });
    });
  });

  // Plain-language reading of the diagnostics the content script saves.
  function diagnose(diag) {
    const out = [];
    const ok = (text) => out.push({ text, ok: true });
    const bad = (text) => out.push({ text });
    if (!diag) {
      bad('The extension has never run on a Libby page. Check that it is enabled and up to date (reload it on chrome://extensions after updating), that its Site access allows libbyapp.com, and then reload the Libby tab.');
      return out;
    }
    const v = chrome.runtime.getManifest().version;
    ok(`Last ran v${diag.version} on ${diag.url} at ${new Date(diag.savedAt || diag.startedAt).toLocaleString()}.`);
    if (diag.version !== v) bad(`That was an older version (now v${v}). Reload the Libby tab.`);
    if (!diag.libraryTitles) bad('The Libby tab saw no imported library. Import one above, then reload the Libby tab.');
    if (diag.errors && diag.errors.length) bad('Errors: ' + diag.errors.join(' | '));
    if (!diag.hookAlive) bad('The network hook did not start, so book data cannot be read from Libby (needs Chrome 111 or newer).');
    const reqs = Object.entries(diag.requests || {});
    const parsed = reqs.filter(([, r]) => r.json);
    if (diag.hookAlive && !reqs.length) bad('No network requests were seen. Libby may be loading data in a way the hook does not cover.');
    else if (reqs.length && !parsed.length) bad(`Saw ${reqs.length} request(s), but none returned JSON from overdrive.com or libbyapp.com.`);
    else if (parsed.length && !diag.captured) bad(`Read ${parsed.length} JSON response(s), but found no book records in them. Libby's data format probably differs from what the extension expects.`);
    else if (diag.captured) ok(`Captured ${diag.captured} book record(s) from Libby.`);
    if (diag.lastScan) {
      const b = diag.lastScan.badges;
      (b ? ok : bad)(`Last scan: ${diag.lastScan.textElements} text elements on the page, ${b} badge(s).`);
    } else if (diag.libraryTitles) bad('The page has not been scanned yet.');
    return out;
  }

  function renderDiag(diag) {
    const ul = $('diagSummary');
    ul.textContent = '';
    for (const { text, ok } of diagnose(diag)) {
      const li = document.createElement('li');
      li.textContent = text;
      if (ok) li.className = 'ok';
      ul.appendChild(li);
    }
    $('diag').textContent = diag ? JSON.stringify(diag, null, 2) : '(none yet)';
  }

  $('copyDiag').addEventListener('click', async () => {
    const summary = [...$('diagSummary').children].map((li) => '- ' + li.textContent).join('\n');
    await navigator.clipboard.writeText(summary + '\n\n' + $('diag').textContent);
    $('copied').textContent = 'Copied.';
    setTimeout(() => ($('copied').textContent = ''), 2000);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.diag) renderDiag(changes.diag.newValue);
  });

  chrome.storage.local.get(['library', 'settings', 'diag'], (d) => {
    library = d.library || null;
    $('debug').checked = !!(d.settings && d.settings.debug);
    render();
    renderDiag(d.diag);
  });
})();
