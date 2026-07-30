import { TABS, DEFAULT_TAB, APP_REPO, SYNC_WORKFLOW_FILE } from './config.js';
import { getUnits, setUnits } from './units.js';
import * as store from './storage/store.js';
import { getToken, setToken, hasToken } from './storage/github-api.js';
import { initTabbar } from './ui/tabbar.js';
import { el, openModal, toast, downloadJson } from './ui/components.js';
import { loadPreset } from './presets.js';

const badge = document.getElementById('sync-badge');

function renderBadge() {
  const { status } = store.syncStatus();
  badge.hidden = false;
  badge.className = 'sync-badge';
  if (store.encryption().locked) {
    badge.textContent = '🔒 locked';
    badge.classList.add('error');
  } else if (status === 'local') {
    badge.textContent = 'local only';
  } else if (status === 'pending') {
    badge.textContent = 'pending sync';
    badge.classList.add('pending');
  } else if (status === 'error') {
    badge.textContent = 'sync error';
    badge.classList.add('error');
  } else {
    badge.textContent = 'synced';
    badge.classList.add('ok');
  }
}

// ---------- Settings ----------
// Sections are native <details> so the modal fits one screen; each summary
// shows its current state, and every action sits next to the input it acts
// on (the Save button used to live in the modal footer, which read as if
// "Sync Strava now" were the way to save a token).

function settingsSection({ id, name, state, body, open = false }) {
  return el('details', { class: 'settings-section', dataset: { section: id }, open },
    el('summary', {},
      el('span', { class: 'sec-name' }, name),
      el('span', { class: 'sec-state' }, state),
    ),
    el('div', { class: 'settings-body' }, body),
  );
}

// Why a remote action can't run yet, or null when it can.
function syncBlocker() {
  const missing = [];
  if (!store.hasDataRepo()) missing.push('a data repository');
  if (!hasToken()) missing.push('a GitHub token');
  return missing.length ? `Set ${missing.join(' and ')} first.` : null;
}

// Personal data lives in a separate PRIVATE repo, not the public one that
// serves this app. Configured here so it needs no redeploy, and left unset
// by default so nothing personal is ever written somewhere public.
function dataRepoSection(reopen) {
  const current = store.getDataRepo();
  const ownerInput = el('input', { value: current?.owner ?? APP_REPO.owner, placeholder: 'github-username' });
  const repoInput = el('input', { value: current?.repo ?? '', placeholder: 'fitness-data' });
  const branchInput = el('input', { value: current?.branch ?? 'main', placeholder: 'main' });

  const blocker = syncBlocker();
  const seedBtn = el('button', {
    class: 'btn secondary',
    disabled: !!blocker,
    onclick: async () => {
      seedBtn.disabled = true;
      try {
        await store.pushAllData();
        toast('Uploaded all local data to the data repo');
      } catch (e) {
        toast(e.message, 'error');
      }
      seedBtn.disabled = false;
      renderBadge();
    },
  }, 'Upload all local data');

  return {
    state: current?.owner && current?.repo ? `${current.owner}/${current.repo}` : 'not set',
    body: el('div', {},
      el('p', { class: 'muted' },
        current?.owner && current?.repo
          ? `Syncing to ${current.owner}/${current.repo} (branch ${current.branch}). This should be a private repo.`
          : 'Not set — the app is local-only, keeping everything in this browser. '
            + 'Create a private repo on GitHub and enter it here to sync.'),
      el('div', { class: 'field-row' },
        el('div', { class: 'field' }, el('label', {}, 'Owner'), ownerInput),
        el('div', { class: 'field' }, el('label', {}, 'Repo'), repoInput),
        el('div', { class: 'field' }, el('label', {}, 'Branch'), branchInput),
      ),
      el('div', { class: 'field-row' },
        el('button', {
          class: 'btn',
          onclick: async () => {
            if (!repoInput.value.trim() || !ownerInput.value.trim()) {
              toast('Enter an owner and a repo name', 'error');
              return;
            }
            store.setDataRepo({ owner: ownerInput.value, repo: repoInput.value, branch: branchInput.value });
            store.refreshStatus();
            if (hasToken()) {
              try {
                await store.client.validate();
                toast('Data repo saved — syncing');
                store.refresh().then(() => tabbar.refresh());
              } catch {
                toast('Saved, but GitHub could not reach that repo — check the name and token scope', 'error');
              }
            } else {
              toast('Data repo saved — now add a token below');
            }
            reopen('token');
          },
        }, 'Save data repo'),
        seedBtn,
      ),
      blocker
        ? el('p', { class: 'muted', style: 'margin:6px 0 0' }, `Upload needs a token too. ${blocker}`)
        : el('p', { class: 'muted', style: 'margin:6px 0 0' },
            'Press “Upload all local data” once, right after connecting a new repo, to seed it from this browser.'),
      el('p', { class: 'muted' },
        `The app itself is served from the public ${APP_REPO.owner}/${APP_REPO.repo}, which holds no personal data.`),
    ),
  };
}

// The PAT used to reach the data repo. Save sits directly under the input.
function tokenSection(reopen) {
  const patInput = el('input', {
    type: 'password',
    placeholder: hasToken() ? '••••••••  (token saved)' : 'github_pat_…',
    autocomplete: 'off',
  });
  const save = async () => {
    const v = patInput.value.trim();
    if (!v) {
      toast('Paste a token into the field first', 'error');
      return;
    }
    setToken(v);
    store.refreshStatus();
    try {
      await store.client.validate();
      toast('Token saved — syncing');
      store.flushQueue().then(() => store.refresh()).then(() => tabbar.refresh());
    } catch (e) {
      toast(e.name === 'NotConfiguredError'
        ? 'Token saved — set a data repository above to start syncing'
        : 'Token saved, but GitHub rejected it — check its scope and expiry', 'error');
    }
    reopen('token');
  };

  return {
    state: hasToken() ? 'saved' : 'not set',
    body: el('div', {},
      el('p', { class: 'muted' },
        'A fine-grained personal access token scoped to only your private data repo, with ',
        'Contents read/write (plus Actions read/write for Strava sync). ',
        'It needs no access to the public repo that serves this app.'),
      el('div', { class: 'field' }, el('label', {}, 'Personal access token'), patInput),
      el('div', { class: 'field-row' },
        el('button', { class: 'btn', onclick: save }, 'Save token'),
        el('button', {
          class: 'btn secondary',
          onclick: () => {
            setToken('');
            toast('Token cleared — app is local-only');
            store.refreshStatus();
            reopen('token');
          },
        }, 'Clear token'),
      ),
      el('p', { class: 'muted' },
        'The token stays in this browser (localStorage) and is only sent to api.github.com.'),
    ),
  };
}

// Triggers the workflow that lives in the DATA repo, not this one.
function stravaSection() {
  const blocker = syncBlocker();
  const syncBtn = el('button', {
    class: 'btn secondary',
    disabled: !!blocker,
    onclick: async () => {
      try {
        await store.client.dispatchWorkflow(SYNC_WORKFLOW_FILE);
        toast('Strava sync triggered — new activities land in a minute or two');
        pollStrava();
      } catch (e) {
        toast(`Could not trigger sync: ${e.message}`, 'error');
      }
    },
  }, 'Sync Strava now');

  return {
    state: blocker ? 'needs setup' : 'ready',
    body: el('div', {},
      el('p', { class: 'muted' },
        'Strava syncs on a schedule from a workflow in your data repo — this button just runs it now. ',
        'It needs the Strava secrets set up there first; see datarepo-template/README.md.'),
      syncBtn,
      blocker ? el('p', { class: 'muted', style: 'margin:6px 0 0' }, blocker) : null,
    ),
  };
}

// Optional password encrypting logs, body metrics, and GPS shards in the
// repo (AES-GCM, see js/crypto.js). Enable/change re-writes those files;
// disabling decrypts them back to plaintext.
function privacySection(reopen) {
  const { enabled, locked } = store.encryption();
  const pwInput = el('input', { type: 'password', placeholder: enabled ? 'new password…' : 'password…', autocomplete: 'new-password' });

  const apply = async () => {
    const pw = pwInput.value.trim();
    if (!pw) { toast('Enter a password first', 'error'); return; }
    setBusy(true);
    store.setPassword(pw);
    await store.refresh(); // decrypt anything currently locked
    if (store.encryption().locked) {
      toast('That password doesn’t unlock the synced files', 'error');
    } else {
      await store.rewriteEncryptedFiles();
      toast(enabled ? 'Password updated' : 'Encryption enabled');
      tabbar.refresh();
    }
    setBusy(false);
    renderBadge();
    reopen('privacy');
  };
  const disable = async () => {
    if (store.encryption().locked) {
      toast('Unlock with the current password before disabling', 'error');
      return;
    }
    setBusy(true);
    store.setPassword('');
    await store.rewriteEncryptedFiles();
    toast('Encryption disabled — files stored as plaintext again');
    setBusy(false);
    renderBadge();
    reopen('privacy');
  };
  const applyBtn = el('button', { class: 'btn secondary', onclick: apply },
    locked ? 'Unlock' : enabled ? 'Change password' : 'Enable encryption');
  const disableBtn = enabled ? el('button', { class: 'btn secondary', onclick: disable }, 'Disable') : null;
  const setBusy = (b) => {
    applyBtn.disabled = b;
    if (disableBtn) disableBtn.disabled = b;
  };

  return {
    state: locked ? '🔒 locked' : enabled ? 'encryption on' : 'encryption off',
    body: el('div', {},
      el('p', { class: 'muted' },
        locked
          ? 'Some synced files are encrypted and the password is missing or wrong — enter it below to unlock.'
          : enabled
            ? 'Logs, body metrics, goals, and GPS data are encrypted in the repo. '
              + 'Set the same password as the ENCRYPTION_PASSWORD Actions variable in your data repo for Strava sync.'
            : 'Optional second layer: encrypt logs, body metrics, goals, and GPS data before they are '
              + 'committed. Plans and the exercise library stay readable.'),
      el('div', { class: 'field' }, el('label', {}, 'Encryption password'), pwInput),
      el('div', { class: 'field-row' }, applyBtn, disableBtn),
      el('p', { class: 'muted' },
        '⚠ There is no recovery: a lost password means the encrypted data can’t be read.'),
    ),
  };
}

function unitsSection() {
  // Units apply immediately on change; stored data stays metric, only the
  // display converts, so this is always safe to flip back and forth.
  const units = getUnits();
  const unitSelect = (key, options) => el('select', {
    onchange: (e) => {
      setUnits({ [key]: e.target.value });
      tabbar.refresh();
    },
  }, options.map(([v, label]) => el('option', { value: v, selected: units[key] === v }, label)));

  return {
    state: `${units.weight} · ${units.distance} · ${units.length}`,
    body: el('div', {},
      el('div', { class: 'field-row' },
        el('div', { class: 'field' }, el('label', {}, 'Weight'),
          unitSelect('weight', [['kg', 'kilograms (kg)'], ['lb', 'pounds (lb)']])),
        el('div', { class: 'field' }, el('label', {}, 'Distance'),
          unitSelect('distance', [['km', 'kilometers (km)'], ['mi', 'miles (mi)']])),
        el('div', { class: 'field' }, el('label', {}, 'Body'),
          unitSelect('length', [['cm', 'centimeters (cm)'], ['in', 'inches (in)']])),
      ),
      el('p', { class: 'muted' },
        'Display only — stored data and exported templates are always metric, so switching never rewrites anything.'),
    ),
  };
}

function templatesSection() {
  return {
    state: 'example .plan.json',
    body: el('div', {},
      el('button', {
        class: 'btn secondary',
        onclick: async () => {
          try {
            downloadJson('example.plan.json', await loadPreset('plans/example.plan.json'));
            toast('Template downloaded — edit it, then use Import on the Plans tab');
          } catch (e) {
            toast(e.message, 'error');
          }
        },
      }, 'Download plan template'),
      el('p', { class: 'muted' },
        'A starter file showing every target type (metric: kg / meters). The Plans and Fitness Library ',
        'tabs also have Import buttons listing all the bundled starter plans and exercise packs.'),
    ),
  };
}

// openSection: which section to expand. Defaults to the first unfinished
// setup step, so opening Settings shows you what to do next.
function openSettings({ openSection = null } = {}) {
  let modal;
  const reopen = (section) => {
    modal?.close();
    openSettings({ openSection: section });
  };

  const repoDone = store.hasDataRepo();
  const tokenDone = hasToken();
  const active = openSection ?? (!repoDone ? 'datarepo' : !tokenDone ? 'token' : 'datarepo');

  const specs = [
    { id: 'datarepo', name: 'Data repository', ...dataRepoSection(reopen) },
    { id: 'token', name: 'GitHub token', ...tokenSection(reopen) },
    { id: 'strava', name: 'Strava sync', ...stravaSection() },
    { id: 'privacy', name: 'Privacy', ...privacySection(reopen) },
    { id: 'units', name: 'Units', ...unitsSection() },
    { id: 'templates', name: 'Plan templates', ...templatesSection() },
  ];
  const sections = new Map();
  const sectionEls = specs.map((spec) => {
    const node = settingsSection({ ...spec, open: spec.id === active });
    sections.set(spec.id, node);
    return node;
  });

  const reveal = (id) => {
    const node = sections.get(id);
    if (!node) return;
    node.open = true;
    node.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  // Setup checklist — answers "what do I still need to do?" at a glance.
  const checkRow = (label, done, detail, target) => el('div', {
    class: 'list-row check-row tappable',
    onclick: () => reveal(target),
  },
    el('span', { class: `mark ${done ? 'done' : 'todo'}` }, done ? '✓' : '○'),
    el('div', { class: 'row-main' },
      el('div', { class: 'row-title' }, label),
      el('div', { class: 'row-sub' }, detail),
    ),
  );
  const repoCfg = store.getDataRepo();
  const checklist = el('div', { class: 'card' },
    checkRow('Data repository', repoDone,
      repoDone ? `${repoCfg.owner}/${repoCfg.repo}` : 'not set — tap to configure', 'datarepo'),
    checkRow('GitHub token', tokenDone,
      tokenDone ? 'saved in this browser' : 'not set — tap to add', 'token'),
    checkRow('Strava sync', false,
      syncBlocker() ? 'optional — needs the two above' : 'optional — ready to run', 'strava'),
  );

  modal = openModal('Settings', el('div', {}, checklist, sectionEls),
    [{ label: 'Close', class: 'btn secondary', onClick: () => {} }]);
}

// After a manual workflow dispatch, watch for new Strava data for ~2 minutes.
function pollStrava() {
  let tries = 0;
  const timer = setInterval(async () => {
    tries++;
    const changed = await store.refreshStrava().catch(() => false);
    if (changed || tries >= 8) {
      clearInterval(timer);
      if (changed) toast('New Strava activities synced');
    }
  }, 15000);
}

document.getElementById('settings-btn').addEventListener('click', openSettings);

store.onChange((e) => {
  if (e.type === 'sync-status') renderBadge();
});
store.init();
renderBadge();

const tabbar = initTabbar({
  tabs: TABS,
  defaultTab: DEFAULT_TAB,
  navEl: document.getElementById('tabbar'),
  viewEl: document.getElementById('view'),
  ctx: { store, openSettings },
});

// First-run nudge: no token and nothing cached yet.
if (!hasToken() && !localStorage.getItem('ft.welcomed')) {
  localStorage.setItem('ft.welcomed', '1');
  toast('Running in local-only mode — open ⚙ Settings to connect GitHub');
}
