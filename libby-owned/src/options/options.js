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

  chrome.storage.local.get(['library', 'settings'], (d) => {
    library = d.library || null;
    $('debug').checked = !!(d.settings && d.settings.debug);
    render();
  });
})();
