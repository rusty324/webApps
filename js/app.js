import { TABS, DEFAULT_TAB, REPO, SYNC_WORKFLOW_FILE } from './config.js';
import { getUnits, setUnits } from './units.js';
import * as store from './storage/store.js';
import { getToken, setToken, hasToken } from './storage/github-api.js';
import { initTabbar } from './ui/tabbar.js';
import { el, openModal, toast, downloadJson } from './ui/components.js';

// Starter template for the Plans tab's Import — shows every target kind so
// it can be edited in any text editor and imported as-is.
const EXAMPLE_TEMPLATE = {
  format: 'fitness-tracker-plan',
  version: 1,
  name: 'Example Plan (edit me)',
  type: 'custom',
  sessions: [
    {
      label: 'Day 1 · Strength',
      dayOffset: 0,
      exercises: [
        { name: 'Back Squat', category: 'strength', defaultUnit: 'reps', target: { kind: 'reps', sets: 3, reps: 8, weight: 60 } },
        { name: 'Plank', category: 'strength', defaultUnit: 'duration', target: { kind: 'duration', durationSec: 120 } },
      ],
    },
    {
      label: 'Day 3 · Easy run',
      dayOffset: 2,
      exercises: [
        { name: 'Easy Run', category: 'running', defaultUnit: 'distance', target: { kind: 'distance', distanceM: 5000, paceSecPerKm: 360 } },
      ],
    },
  ],
};

const badge = document.getElementById('sync-badge');

function renderBadge() {
  const { status } = store.syncStatus();
  badge.hidden = false;
  badge.className = 'sync-badge';
  if (status === 'local') {
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

function openSettings() {
  const patInput = el('input', {
    type: 'password',
    placeholder: hasToken() ? '••••••••  (token saved)' : 'github_pat_…',
    autocomplete: 'off',
  });
  // Units apply immediately on change; stored data stays metric, only the
  // display converts, so this is always safe to flip back and forth.
  const units = getUnits();
  const unitSelect = (key, options) => el('select', {
    onchange: (e) => {
      setUnits({ [key]: e.target.value });
      tabbar.refresh();
    },
  }, options.map(([v, label]) => el('option', { value: v, selected: units[key] === v }, label)));

  const body = el('div', {},
    el('h3', {}, 'Units'),
    el('div', { class: 'field-row' },
      el('div', { class: 'field' }, el('label', {}, 'Weight'),
        unitSelect('weight', [['kg', 'kilograms (kg)'], ['lb', 'pounds (lb)']])),
      el('div', { class: 'field' }, el('label', {}, 'Distance'),
        unitSelect('distance', [['km', 'kilometers (km)'], ['mi', 'miles (mi)']])),
      el('div', { class: 'field' }, el('label', {}, 'Body'),
        unitSelect('length', [['cm', 'centimeters (cm)'], ['in', 'inches (in)']])),
    ),
    el('h3', {}, 'GitHub sync'),
    el('p', { class: 'muted' },
      `Data is saved to ${REPO.owner}/${REPO.repo} (branch ${REPO.branch}) via the GitHub API. `,
      'Paste a fine-grained personal access token scoped to only that repo, with ',
      'Contents read/write (plus Actions read/write for the Sync now button).',
    ),
    el('div', { class: 'field' }, el('label', {}, 'Personal access token'), patInput),
    el('div', { class: 'field-row' },
      el('button', {
        class: 'btn secondary',
        onclick: async () => {
          try {
            await store.client.dispatchWorkflow(SYNC_WORKFLOW_FILE);
            toast('Strava sync triggered — new activities land in a minute or two');
            pollStrava();
          } catch (e) {
            toast(`Could not trigger sync: ${e.message}`, 'error');
          }
        },
      }, 'Sync Strava now'),
      el('button', {
        class: 'btn secondary',
        onclick: () => {
          setToken('');
          toast('Token cleared — app is in local-only mode');
          renderBadge();
        },
      }, 'Clear token'),
    ),
    el('p', { class: 'muted' },
      'The token stays in this browser (localStorage) and is only sent to api.github.com. ',
      'Heads-up: if the repo is public, everything synced to it — including GPS routes — is public too.',
    ),
    el('h3', {}, 'Plan templates'),
    el('button', {
      class: 'btn secondary',
      onclick: () => {
        downloadJson('example.plan.json', EXAMPLE_TEMPLATE);
        toast('Template downloaded — edit it, then use Import on the Plans tab');
      },
    }, 'Download plan template'),
    el('p', { class: 'muted' },
      'A starter .plan.json showing all target types (weights and distances are metric: kg / meters). ',
      'Edit it in any text editor and import it from the Plans tab.',
    ),
  );
  openModal('Settings', body, [
    { label: 'Close', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Save token',
      class: 'btn',
      onClick: async () => {
        const v = patInput.value.trim();
        if (!v) return true; // nothing entered; just close
        setToken(v);
        try {
          await store.client.validate();
          toast('Token saved — syncing');
          store.flushQueue().then(() => store.refresh()).then(() => tabbar.refresh());
        } catch {
          toast('Token saved, but GitHub rejected it — check scope/expiry', 'error');
        }
        renderBadge();
      },
    },
  ]);
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
