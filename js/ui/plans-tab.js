// Training Plans tab: plan CRUD, ordered sessions, session editor with
// exercise-library picker, calendar view, and library management.

import * as store from '../storage/store.js';
import { makePlan, makeSession, makePlannedExercise, makeExercise } from '../models.js';
import { CATEGORIES, TARGET_KINDS } from '../config.js';
import { todayStr, addDays, toDateStr, parseDateStr, formatDate } from '../dates.js';
import {
  formatWeight, formatDistance, formatPaceValue, paceUnit,
  weightUnit, weightToInput, weightFromInput,
  distanceUnit, distanceToInput, distanceFromInput, paceToInput, paceFromInput,
} from '../units.js';
import { el, openModal, confirmDialog, toast, emptyState, downloadJson } from './components.js';

let root = null;
let unsub = null;
let view = { name: 'list' }; // {name:'list'} | {name:'plan', planId} | {name:'calendar'} | {name:'library'}
let calMonth = null; // Date of first of displayed month

export function mount(elRoot) {
  root = elRoot;
  unsub = store.onChange((e) => {
    if (e.type === 'changed') render();
  });
  render();
}

export function unmount() {
  unsub?.();
  root = null;
}

function render() {
  if (!root) return;
  root.innerHTML = '';
  const seg = el('div', { class: 'segmented' },
    segBtn('Plans', view.name === 'list' || view.name === 'plan', () => { view = { name: 'list' }; render(); }),
    segBtn('Calendar', view.name === 'calendar', () => { view = { name: 'calendar' }; render(); }),
    segBtn('Library', view.name === 'library', () => { view = { name: 'library' }; render(); }),
  );
  root.appendChild(seg);
  if (view.name === 'list') renderPlanList();
  else if (view.name === 'plan') renderPlanDetail(view.planId);
  else if (view.name === 'calendar') renderCalendar();
  else if (view.name === 'library') renderLibrary();
}

function segBtn(label, active, onclick) {
  return el('button', { class: active ? 'active' : '', onclick }, label);
}

// ---------- Plan list ----------

function renderPlanList() {
  const plans = store.get('plans');
  const active = plans.filter((p) => p.status === 'active');
  const archived = plans.filter((p) => p.status !== 'active');

  root.appendChild(el('div', { class: 'list-row' },
    el('h2', {}, 'Training plans'),
    el('div', { class: 'row-actions' },
      el('button', { class: 'btn small secondary', onclick: () => importPlanModal() }, 'Import'),
      el('button', { class: 'btn small', onclick: () => editPlanMeta(null) }, '+ New plan'),
    ),
  ));

  if (!plans.length) {
    root.appendChild(emptyState('No plans yet. Create one to start scheduling sessions.'));
    return;
  }
  for (const p of active) root.appendChild(planCard(p));
  if (archived.length) {
    root.appendChild(el('h3', { class: 'muted' }, 'Archived'));
    for (const p of archived) root.appendChild(planCard(p));
  }
}

function planCard(plan) {
  const n = plan.sessions.length;
  return el('div', {
    class: 'card tappable',
    onclick: () => { view = { name: 'plan', planId: plan.id }; render(); },
  },
    el('div', { class: 'list-row', style: 'border:none;padding:0' },
      el('div', { class: 'row-main' },
        el('div', { class: 'row-title' }, plan.name),
        el('div', { class: 'row-sub' },
          `${n} session${n === 1 ? '' : 's'} · starts ${formatDate(plan.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}`),
      ),
      el('span', { class: `pill ${plan.status === 'active' ? 'accent' : ''}` }, plan.type),
    ),
  );
}

function editPlanMeta(plan) {
  const isNew = !plan;
  const draft = plan ? { ...plan } : makePlan();
  const nameInput = el('input', { value: draft.name, placeholder: 'e.g. 5k progression, Push/Pull/Legs' });
  const typeInput = el('input', { value: draft.type, placeholder: 'strength / running / …', list: 'plan-types' });
  const dateInput = el('input', { type: 'date', value: draft.startDate });
  const statusSel = el('select', {},
    el('option', { value: 'active', selected: draft.status === 'active' }, 'Active'),
    el('option', { value: 'archived', selected: draft.status === 'archived' }, 'Archived'),
  );
  const body = el('div', {},
    el('datalist', { id: 'plan-types' }, el('option', { value: 'strength' }), el('option', { value: 'running' })),
    el('div', { class: 'field' }, el('label', {}, 'Name'), nameInput),
    el('div', { class: 'field-row' },
      el('div', { class: 'field' }, el('label', {}, 'Type'), typeInput),
      el('div', { class: 'field' }, el('label', {}, 'Start date'), dateInput),
    ),
    !isNew && el('div', { class: 'field' }, el('label', {}, 'Status'), statusSel),
  );
  const actions = [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: isNew ? 'Create' : 'Save',
      class: 'btn',
      onClick: () => {
        if (!nameInput.value.trim()) { toast('Give the plan a name', 'error'); return false; }
        Object.assign(draft, {
          name: nameInput.value.trim(),
          type: typeInput.value.trim() || 'custom',
          startDate: dateInput.value || todayStr(),
          status: isNew ? 'active' : statusSel.value,
        });
        store.upsert('plans', draft);
        if (isNew) view = { name: 'plan', planId: draft.id };
        render();
      },
    },
  ];
  if (!isNew) {
    actions.unshift({
      label: 'Delete',
      class: 'btn danger',
      onClick: async () => {
        if (!(await confirmDialog(`Delete plan “${plan.name}” and all its sessions?`))) return false;
        store.remove('plans', plan.id);
        view = { name: 'list' };
        render();
      },
    });
  }
  openModal(isNew ? 'New plan' : 'Edit plan', body, actions);
}

// ---------- Plan detail ----------

function renderPlanDetail(planId) {
  const plan = store.get('plans').find((p) => p.id === planId);
  if (!plan) { view = { name: 'list' }; render(); return; }
  const exercises = new Map(store.get('exercises').map((e) => [e.id, e]));

  root.appendChild(el('div', { class: 'list-row' },
    el('div', { class: 'row-main' },
      el('button', { class: 'btn small secondary', onclick: () => { view = { name: 'list' }; render(); } }, '‹ Plans'),
    ),
    el('div', { class: 'row-actions' },
      el('button', { class: 'btn small secondary', onclick: () => exportPlan(plan) }, 'Export'),
      el('button', { class: 'btn small secondary', onclick: () => editPlanMeta(plan) }, 'Edit'),
    ),
  ));
  root.appendChild(el('h2', {}, plan.name, ' ', el('span', { class: 'pill accent' }, plan.type)));

  const list = el('div', {});
  plan.sessions.forEach((s, i) => {
    const date = addDays(plan.startDate, s.dayOffset);
    const exNames = s.plannedExercises
      .map((pe) => exercises.get(pe.exerciseId)?.name ?? '?')
      .join(', ');
    list.appendChild(el('div', { class: 'card' },
      el('div', { class: 'list-row', style: 'border:none;padding:0' },
        el('div', { class: 'row-main tappable', onclick: () => editSession(plan, s) },
          el('div', { class: 'row-title' }, s.label || `Session ${i + 1}`),
          el('div', { class: 'row-sub' },
            `${formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${s.plannedExercises.length} exercise${s.plannedExercises.length === 1 ? '' : 's'}`),
          exNames && el('div', { class: 'row-sub' }, exNames),
        ),
        el('div', { class: 'row-actions' },
          el('button', { class: 'icon-btn', 'aria-label': 'Move up', disabled: i === 0, onclick: () => moveSession(plan, i, -1) }, '↑'),
          el('button', { class: 'icon-btn', 'aria-label': 'Move down', disabled: i === plan.sessions.length - 1, onclick: () => moveSession(plan, i, 1) }, '↓'),
        ),
      ),
    ));
  });
  root.appendChild(list);
  root.appendChild(el('button', { class: 'btn', onclick: () => editSession(plan, null) }, '+ Add session'));
}

function moveSession(plan, i, delta) {
  const s = plan.sessions.splice(i, 1)[0];
  plan.sessions.splice(i + delta, 0, s);
  store.upsert('plans', plan);
  render();
}

// ---------- Session editor ----------

function editSession(plan, session) {
  const isNew = !session;
  const draft = session
    ? JSON.parse(JSON.stringify(session))
    : makeSession({ dayOffset: nextOffset(plan) });

  const labelInput = el('input', { value: draft.label, placeholder: 'e.g. Week 1 · Day 2, Tempo run' });
  const dateInput = el('input', { type: 'date', value: addDays(plan.startDate, draft.dayOffset) });
  const exList = el('div', {});

  function renderExList() {
    exList.innerHTML = '';
    const lib = new Map(store.get('exercises').map((e) => [e.id, e]));
    draft.plannedExercises.forEach((pe, i) => {
      const ex = lib.get(pe.exerciseId);
      exList.appendChild(el('div', { class: 'list-row' },
        el('div', { class: 'row-main' },
          el('div', { class: 'row-title' }, ex?.name ?? 'Unknown exercise'),
          el('div', { class: 'row-sub' }, targetSummary(pe.target)),
        ),
        el('div', { class: 'row-actions' },
          el('button', { class: 'icon-btn', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { swap(draft.plannedExercises, i, i - 1); renderExList(); } }, '↑'),
          el('button', { class: 'icon-btn', 'aria-label': 'Edit target', onclick: () => editTarget(pe, ex, renderExList) }, '✎'),
          el('button', { class: 'icon-btn', 'aria-label': 'Remove', onclick: () => { draft.plannedExercises.splice(i, 1); renderExList(); } }, '✕'),
        ),
      ));
    });
    if (!draft.plannedExercises.length) exList.appendChild(el('p', { class: 'muted' }, 'No exercises yet.'));
  }
  renderExList();

  const body = el('div', {},
    el('div', { class: 'field' }, el('label', {}, 'Label'), labelInput),
    el('div', { class: 'field' }, el('label', {}, 'Date'), dateInput),
    el('h3', {}, 'Exercises'),
    exList,
    el('button', {
      class: 'btn secondary small',
      onclick: () => pickExercise((ex) => {
        const pe = makePlannedExercise({ sessionId: draft.id, exerciseId: ex.id, order: draft.plannedExercises.length });
        pe.target = defaultTarget(ex);
        editTarget(pe, ex, () => { draft.plannedExercises.push(pe); renderExList(); });
      }),
    }, '+ Add exercise'),
  );

  const actions = [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: isNew ? 'Add session' : 'Save',
      class: 'btn',
      onClick: () => {
        draft.label = labelInput.value.trim();
        if (dateInput.value) {
          draft.dayOffset = Math.round((parseDateStr(dateInput.value) - parseDateStr(plan.startDate)) / 86400000);
        }
        draft.plannedExercises.forEach((pe, i) => { pe.order = i; });
        const i = plan.sessions.findIndex((s) => s.id === draft.id);
        if (i >= 0) plan.sessions[i] = draft;
        else plan.sessions.push(draft);
        store.upsert('plans', plan);
        render();
      },
    },
  ];
  if (!isNew) {
    actions.unshift({
      label: 'Delete',
      class: 'btn danger',
      onClick: async () => {
        if (!(await confirmDialog('Delete this session?'))) return false;
        plan.sessions = plan.sessions.filter((s) => s.id !== draft.id);
        store.upsert('plans', plan);
        render();
      },
    });
  }
  openModal(isNew ? 'New session' : 'Edit session', body, actions);
}

function nextOffset(plan) {
  const max = plan.sessions.reduce((m, s) => Math.max(m, s.dayOffset), -1);
  return max + 1;
}

function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function defaultTarget(ex) {
  if (ex.defaultUnit === 'distance') return { kind: 'distance', distanceM: 5000 };
  if (ex.defaultUnit === 'duration') return { kind: 'duration', durationSec: 1800 };
  return { kind: 'reps', sets: 3, reps: 10 };
}

export function targetSummary(target) {
  if (!target?.kind) return 'no target';
  if (target.kind === 'reps') {
    return `${target.sets ?? '?'} × ${target.reps ?? '?'}${target.weight ? ` @ ${formatWeight(target.weight)}` : ''}`;
  }
  if (target.kind === 'distance') {
    const dist = target.distanceM ? formatDistance(target.distanceM) : '';
    const pace = target.paceSecPerKm ? ` @ ${formatPaceValue(target.paceSecPerKm)}` : '';
    return dist + pace || 'distance';
  }
  if (target.kind === 'duration') {
    return target.durationSec ? `${Math.round(target.durationSec / 60)} min` : 'duration';
  }
  return 'no target';
}

// Target editor modal, shape depends on kind.
function editTarget(pe, ex, done) {
  const t = pe.target ?? defaultTarget(ex);
  const kindSel = el('select', {},
    TARGET_KINDS.map((k) => el('option', { value: k.id, selected: t.kind === k.id }, k.label)),
  );
  const fields = el('div', {});

  function renderFields() {
    const kind = kindSel.value;
    fields.innerHTML = '';
    if (kind === 'reps') {
      fields.append(
        el('div', { class: 'field-row' },
          field('Sets', num('sets', t.sets ?? 3)),
          field('Reps', num('reps', t.reps ?? 10)),
          field(`Weight (${weightUnit()})`, num('weight', weightToInput(t.weight) ?? '', 0.5)),
        ),
      );
    } else if (kind === 'distance') {
      fields.append(
        el('div', { class: 'field-row' },
          field(`Distance (${distanceUnit()})`, num('km', distanceToInput(t.distanceM ?? 5000), 0.1)),
          field(`Pace (min${paceUnit()})`, num('pace', paceToInput(t.paceSecPerKm) ?? '', 0.05)),
        ),
      );
    } else {
      fields.append(el('div', { class: 'field-row' }, field('Duration (min)', num('min', t.durationSec ? t.durationSec / 60 : 30))));
    }
  }
  function field(label, input) {
    return el('div', { class: 'field' }, el('label', {}, label), input);
  }
  function num(name, value, step = 1) {
    return el('input', { type: 'number', inputmode: 'decimal', step, value, dataset: { name } });
  }
  kindSel.addEventListener('change', renderFields);
  renderFields();

  openModal(`Target — ${ex?.name ?? ''}`, el('div', {}, el('div', { class: 'field' }, el('label', {}, 'Target type'), kindSel), fields), [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Save',
      class: 'btn',
      onClick: () => {
        const val = (n) => {
          const input = fields.querySelector(`[data-name="${n}"]`);
          const v = parseFloat(input?.value);
          return isNaN(v) ? null : v;
        };
        const kind = kindSel.value;
        if (kind === 'reps') {
          pe.target = { kind, sets: val('sets'), reps: val('reps') };
          if (val('weight') != null) pe.target.weight = weightFromInput(val('weight'));
        } else if (kind === 'distance') {
          pe.target = { kind, distanceM: distanceFromInput(val('km')) };
          if (val('pace') != null) pe.target.paceSecPerKm = paceFromInput(val('pace'));
        } else {
          pe.target = { kind, durationSec: val('min') != null ? Math.round(val('min') * 60) : null };
        }
        done();
      },
    },
  ]);
}

// ---------- Exercise picker ----------

export function pickExercise(onPick) {
  const search = el('input', { placeholder: 'Search exercises…', autocomplete: 'off' });
  const list = el('div', {});
  let modal;

  function renderList() {
    const q = search.value.trim().toLowerCase();
    const lib = store.get('exercises').filter((e) => !q || e.name.toLowerCase().includes(q));
    list.innerHTML = '';
    for (const ex of lib.slice(0, 30)) {
      list.appendChild(el('div', { class: 'list-row tappable', onclick: () => { modal.close(); onPick(ex); } },
        el('div', { class: 'row-main' },
          el('div', { class: 'row-title' }, ex.name),
          el('div', { class: 'row-sub' }, `${ex.category} · ${ex.defaultUnit}`),
        ),
      ));
    }
    if (!lib.length) {
      list.appendChild(el('p', { class: 'muted' }, q ? `No match for “${search.value}”.` : 'Library is empty.'));
    }
  }
  search.addEventListener('input', renderList);
  renderList();

  modal = openModal('Pick exercise', el('div', {},
    el('div', { class: 'field' }, search),
    list,
    el('button', {
      class: 'btn secondary small',
      onclick: () => {
        modal.close();
        editExercise(null, (ex) => onPick(ex), search.value.trim());
      },
    }, '+ New exercise'),
  ), [{ label: 'Cancel', class: 'btn secondary', onClick: () => {} }]);
  setTimeout(() => search.focus(), 50);
}

// ---------- Exercise library ----------

export function editExercise(ex, onSaved, prefillName = '') {
  const isNew = !ex;
  const draft = ex ? { ...ex } : makeExercise({ name: prefillName });
  const nameInput = el('input', { value: draft.name, placeholder: 'e.g. Back squat, Easy run' });
  const catSel = el('select', {}, CATEGORIES.map((c) => el('option', { value: c, selected: draft.category === c }, c)));
  const unitSel = el('select', {},
    ['reps', 'duration', 'distance'].map((u) => el('option', { value: u, selected: draft.defaultUnit === u }, u)),
  );
  openModal(isNew ? 'New exercise' : 'Edit exercise', el('div', {},
    el('div', { class: 'field' }, el('label', {}, 'Name'), nameInput),
    el('div', { class: 'field-row' },
      el('div', { class: 'field' }, el('label', {}, 'Category'), catSel),
      el('div', { class: 'field' }, el('label', {}, 'Default unit'), unitSel),
    ),
  ), [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Save',
      class: 'btn',
      onClick: () => {
        if (!nameInput.value.trim()) { toast('Name required', 'error'); return false; }
        Object.assign(draft, { name: nameInput.value.trim(), category: catSel.value, defaultUnit: unitSel.value });
        store.upsert('exercises', draft);
        onSaved?.(draft);
      },
    },
  ]);
}

function renderLibrary() {
  const lib = store.get('exercises');
  root.appendChild(el('div', { class: 'list-row' },
    el('h2', {}, 'Exercise library'),
    el('button', { class: 'btn small', onclick: () => editExercise(null, () => render()) }, '+ New'),
  ));
  if (!lib.length) {
    root.appendChild(emptyState('No exercises yet. They’re also created inline while building sessions.'));
    return;
  }
  const card = el('div', { class: 'card' });
  for (const ex of [...lib].sort((a, b) => a.name.localeCompare(b.name))) {
    card.appendChild(el('div', { class: 'list-row' },
      el('div', { class: 'row-main tappable', onclick: () => editExercise(ex, () => render()) },
        el('div', { class: 'row-title' }, ex.name),
        el('div', { class: 'row-sub' }, `${ex.category} · ${ex.defaultUnit}`),
      ),
      el('button', {
        class: 'icon-btn', 'aria-label': 'Delete',
        onclick: async () => {
          if (!(await confirmDialog(`Delete “${ex.name}” from the library?`))) return;
          store.remove('exercises', ex.id);
          render();
        },
      }, '✕'),
    ));
  }
  root.appendChild(card);
}

// ---------- Import / export ----------
// One portable, hand-editable format serves export, import, and templates:
// exercises are inlined by name (no internal ids), scheduling is relative
// (dayOffset only — no dates), so an exported file can be edited in any
// text editor and re-imported, into this or another instance.
//
// {
//   "format": "fitness-tracker-plan", "version": 1,
//   "name": "...", "type": "running",
//   "sessions": [
//     { "label": "Week 1 · Day 1", "dayOffset": 0,
//       "exercises": [
//         { "name": "Tempo Run", "category": "running", "defaultUnit": "distance",
//           "target": { "kind": "distance", "distanceM": 8000 } }
//       ] }
//   ]
// }

export function serializePlan(plan) {
  const lib = new Map(store.get('exercises').map((e) => [e.id, e]));
  return {
    format: 'fitness-tracker-plan',
    version: 1,
    name: plan.name,
    type: plan.type,
    sessions: plan.sessions.map((s) => ({
      label: s.label,
      dayOffset: s.dayOffset,
      exercises: [...s.plannedExercises]
        .sort((a, b) => a.order - b.order)
        .map((pe) => {
          const ex = lib.get(pe.exerciseId);
          return {
            name: ex?.name ?? 'Unknown exercise',
            category: ex?.category ?? 'other',
            defaultUnit: ex?.defaultUnit ?? 'reps',
            target: pe.target ?? {},
          };
        }),
    })),
  };
}

function exportPlan(plan) {
  const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan';
  downloadJson(`${slug}.plan.json`, serializePlan(plan));
  toast('Exported — edit the file as a template and re-import it anytime');
}

// Builds a fresh plan (new ids) from a portable object. Exercises are matched
// to the library by name, case-insensitively; missing ones are created.
export function importPlan(data, startDate) {
  if (!data || typeof data !== 'object' || typeof data.name !== 'string' || !Array.isArray(data.sessions)) {
    throw new Error('Not a plan file: expected { name, sessions: [...] }');
  }
  const library = store.get('exercises').slice();
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e]));
  let libChanged = false;

  const plan = makePlan({ name: data.name, type: data.type || 'custom', startDate });
  for (const s of data.sessions) {
    const session = makeSession({
      label: typeof s.label === 'string' ? s.label : '',
      dayOffset: Number.isFinite(Number(s.dayOffset)) ? Number(s.dayOffset) : 0,
    });
    (s.exercises ?? s.plannedExercises ?? []).forEach((def, i) => {
      const name = (def.name ?? '').trim() || 'Exercise';
      let ex = byName.get(name.toLowerCase());
      if (!ex) {
        ex = makeExercise({
          name,
          category: CATEGORIES.includes(def.category) ? def.category : 'other',
          defaultUnit: ['reps', 'duration', 'distance'].includes(def.defaultUnit) ? def.defaultUnit : 'reps',
        });
        library.push(ex);
        byName.set(name.toLowerCase(), ex);
        libChanged = true;
      }
      session.plannedExercises.push(makePlannedExercise({
        sessionId: session.id,
        exerciseId: ex.id,
        target: def.target && typeof def.target === 'object' ? def.target : {},
        order: i,
      }));
    });
    plan.sessions.push(session);
  }
  if (libChanged) store.save('exercises', library);
  store.upsert('plans', plan);
  return plan;
}

function importPlanModal() {
  const textarea = el('textarea', {
    placeholder: 'Paste a plan JSON here, or pick a file below…',
    style: 'min-height:140px;font-family:monospace;font-size:0.8rem',
  });
  const fileInput = el('input', {
    type: 'file',
    accept: '.json,application/json',
    onchange: () => {
      const f = fileInput.files?.[0];
      if (!f) return;
      f.text().then((t) => { textarea.value = t; }).catch(() => toast('Could not read file', 'error'));
    },
  });
  const dateInput = el('input', { type: 'date', value: todayStr() });
  openModal('Import plan', el('div', {},
    el('div', { class: 'field' }, el('label', {}, 'Plan JSON'), textarea),
    el('div', { class: 'field' }, el('label', {}, 'Or choose a file'), fileInput),
    el('div', { class: 'field' }, el('label', {}, 'Start date (day 0 of the plan)'), dateInput),
    el('p', { class: 'muted' },
      'Exercises are matched to your library by name; any that don’t exist yet are created. ',
      'Tip: “Export” on any plan produces a file in this format — edit it as a template and import it back.'),
  ), [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Import',
      class: 'btn',
      onClick: () => {
        let data;
        try {
          data = JSON.parse(textarea.value);
        } catch {
          toast('That isn’t valid JSON', 'error');
          return false;
        }
        try {
          const plan = importPlan(data, dateInput.value || todayStr());
          toast(`Imported “${plan.name}”`);
          view = { name: 'plan', planId: plan.id };
          render();
        } catch (e) {
          toast(e.message, 'error');
          return false;
        }
      },
    },
  ]);
}

// ---------- Calendar ----------

function renderCalendar() {
  if (!calMonth) {
    const now = new Date();
    calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const plans = store.get('plans').filter((p) => p.status === 'active');
  // date -> [{plan, session}]
  const byDate = new Map();
  for (const p of plans) {
    for (const s of p.sessions) {
      const d = addDays(p.startDate, s.dayOffset);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d).push({ plan: p, session: s });
    }
  }

  const monthName = calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  root.appendChild(el('div', { class: 'cal-header' },
    el('button', { class: 'btn small secondary', onclick: () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); render(); } }, '‹'),
    el('h2', { style: 'margin:0' }, monthName),
    el('button', { class: 'btn small secondary', onclick: () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); render(); } }, '›'),
  ));

  const grid = el('div', { class: 'cal-grid' });
  for (const dow of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
    grid.appendChild(el('div', { class: 'cal-dow' }, dow));
  }
  // Monday-first grid
  const firstDow = (calMonth.getDay() + 6) % 7;
  const start = new Date(calMonth);
  start.setDate(1 - firstDow);
  const today = todayStr();
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = toDateStr(d);
    const cell = el('div', {
      class: `cal-cell${d.getMonth() !== calMonth.getMonth() ? ' other-month' : ''}${ds === today ? ' today' : ''}`,
    }, el('span', { class: 'cal-day-num' }, d.getDate()));
    for (const { plan, session } of byDate.get(ds) ?? []) {
      cell.appendChild(el('span', { class: 'cal-dot', title: `${plan.name}: ${session.label}` },
        session.label || plan.name));
    }
    grid.appendChild(cell);
  }
  root.appendChild(grid);
  if (!plans.length) root.appendChild(el('p', { class: 'muted', style: 'margin-top:12px' }, 'No active plans to show.'));
}
