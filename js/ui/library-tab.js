// Fitness Library tab: the exercise library (with full v2 detail — cues,
// safety notes, variants — and per-set RWI history) plus training Goals
// (bodyweight, run times, exercise targets).
//
// RWI (Relative Work Index) normalizes bodyweight work against your goal
// weight: RWI = (reps, or duration in seconds) × (goal weight / body weight
// at the time of the set). As you approach your goal weight the ratio → 1.

import * as store from '../storage/store.js';
import { makeGoal } from '../models.js';
import { RUN_GOAL_PRESETS } from '../config.js';
import { todayStr, formatDate, formatDuration } from '../dates.js';
import {
  formatWeight, formatDistance, formatPace, weightUnit, weightToInput, weightFromInput,
  distanceToInput, distanceFromInput, distanceUnit,
} from '../units.js';
import { el, openModal, confirmDialog, toast, emptyState } from './components.js';
import { editExercise, pickExercise, targetSummary } from './plans-tab.js';

let root = null;
let unsub = null;
let view = { name: 'exercises' }; // {name:'exercises'} | {name:'exercise', id} | {name:'goals'}

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
  root.appendChild(el('div', { class: 'segmented' },
    el('button', {
      class: view.name !== 'goals' ? 'active' : '',
      onclick: () => { view = { name: 'exercises' }; render(); },
    }, 'Exercises'),
    el('button', {
      class: view.name === 'goals' ? 'active' : '',
      onclick: () => { view = { name: 'goals' }; render(); },
    }, 'Goals'),
  ));
  if (view.name === 'goals') renderGoals();
  else if (view.name === 'exercise') renderExerciseDetail(view.id);
  else renderExerciseList();
}

// ---------- Exercise list ----------

function renderExerciseList() {
  const lib = store.get('exercises');
  root.appendChild(el('div', { class: 'list-row' },
    el('h2', {}, 'Exercise library'),
    el('button', { class: 'btn small', onclick: () => editExercise(null, () => render()) }, '+ New'),
  ));
  if (!lib.length) {
    root.appendChild(emptyState('No exercises yet. They’re also created automatically when importing plans.'));
    return;
  }
  const card = el('div', { class: 'card' });
  for (const ex of [...lib].sort((a, b) => a.name.localeCompare(b.name))) {
    card.appendChild(el('div', { class: 'list-row tappable', onclick: () => { view = { name: 'exercise', id: ex.id }; render(); } },
      el('div', { class: 'row-main' },
        el('div', { class: 'row-title' }, ex.name),
        el('div', { class: 'row-sub' }, `${ex.category} · ${ex.modality} · ${ex.measurementType}`),
      ),
      el('span', { class: 'pill' }, String(logCountFor(ex.id)) + ' logs'),
    ));
  }
  root.appendChild(card);
}

function logCountFor(exerciseId) {
  return store.get('logs').filter((l) => l.exerciseId === exerciseId).length;
}

// ---------- Exercise detail ----------

function renderExerciseDetail(id) {
  const ex = store.get('exercises').find((e) => e.id === id);
  if (!ex) { view = { name: 'exercises' }; render(); return; }

  root.appendChild(el('div', { class: 'list-row' },
    el('div', { class: 'row-main' },
      el('button', { class: 'btn small secondary', onclick: () => { view = { name: 'exercises' }; render(); } }, '‹ Library'),
    ),
    el('div', { class: 'row-actions' },
      el('button', { class: 'btn small secondary', onclick: () => editExercise(ex, () => render()) }, 'Edit'),
      el('button', {
        class: 'btn small danger',
        onclick: async () => {
          if (!(await confirmDialog(`Delete “${ex.name}” from the library?`))) return;
          store.remove('exercises', ex.id);
          view = { name: 'exercises' };
          render();
        },
      }, 'Delete'),
    ),
  ));

  root.appendChild(el('h2', {}, ex.name));
  root.appendChild(el('div', { style: 'margin-bottom:10px' },
    el('span', { class: 'pill accent' }, ex.category), ' ',
    el('span', { class: 'pill' }, ex.modality), ' ',
    el('span', { class: 'pill' }, ex.measurementType),
    ex.perSide ? [' ', el('span', { class: 'pill warn' }, 'per side')] : '',
  ));

  if (ex.description) root.appendChild(el('p', {}, ex.description));
  if (ex.whyItsHere) root.appendChild(el('p', { class: 'muted' }, `Why it’s here: ${ex.whyItsHere}`));
  if (ex.equipment?.length) root.appendChild(el('p', { class: 'muted' }, `Equipment: ${ex.equipment.join(', ')}`));
  if (ex.primaryTargets?.length) root.appendChild(el('p', { class: 'muted' }, `Targets: ${ex.primaryTargets.join(', ')}`));

  if (ex.cues?.length) {
    root.appendChild(el('div', { class: 'card' },
      el('h3', {}, 'Cues'),
      el('ul', { style: 'margin:0;padding-left:18px' }, ex.cues.map((c) => el('li', {}, c))),
    ));
  }
  if (ex.safetyNotes?.length) {
    root.appendChild(el('div', { class: 'card', style: 'border-color:var(--danger)' },
      el('h3', {}, '⚠ Safety'),
      el('ul', { style: 'margin:0;padding-left:18px' }, ex.safetyNotes.map((c) => el('li', {}, c))),
    ));
  }
  if (ex.variants?.length) {
    const card = el('div', { class: 'card' }, el('h3', {}, 'Progression variants'));
    for (const v of [...ex.variants].sort((a, b) => a.level - b.level)) {
      card.appendChild(el('div', { class: 'list-row' },
        el('div', { class: 'row-main' },
          el('div', { class: 'row-title' }, `L${v.level} · ${v.name}`),
          v.description && el('div', { class: 'row-sub' }, v.description),
        ),
      ));
    }
    root.appendChild(card);
  }
  if (ex.progressionRule) root.appendChild(el('p', { class: 'muted' }, `Progression: ${ex.progressionRule}`));

  root.appendChild(rwiSection(ex));
}

// ---------- RWI ----------

// Body weight in effect on a given date: the most recent weigh-in on or
// before it, else the earliest one after.
function weightOn(date, metrics) {
  const weighed = metrics.filter((m) => m.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!weighed.length) return null;
  let candidate = null;
  for (const m of weighed) {
    if (m.date <= date) candidate = m;
    else break;
  }
  return (candidate ?? weighed[0]).weight;
}

function rwiSection(ex) {
  const wrap = el('div', {});
  wrap.appendChild(el('h3', {}, 'Relative Work Index'));

  const goal = store.get('goals').find((g) => g.type === 'bodyweight' && g.targetWeight != null);
  const logs = store.get('logs')
    .filter((l) => l.exerciseId === ex.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 15);

  if (!goal) {
    wrap.appendChild(el('p', { class: 'muted' },
      'RWI needs a bodyweight goal: RWI = (reps or seconds per set) × (goal weight ÷ your weight at the time). ',
      'Add one under Goals.'));
    wrap.appendChild(el('button', { class: 'btn secondary small', onclick: () => { view = { name: 'goals' }; render(); } }, 'Go to Goals'));
    return wrap;
  }
  const metrics = store.get('metrics');
  const currentW = weightOn(todayStr(), metrics);
  if (currentW == null) {
    wrap.appendChild(el('p', { class: 'muted' }, 'RWI needs at least one logged body weight (Logs → Metrics).'));
    return wrap;
  }
  wrap.appendChild(el('p', { class: 'muted' },
    `Goal weight ${formatWeight(goal.targetWeight)} · current ${formatWeight(currentW)} · `,
    `ratio ${(goal.targetWeight / currentW).toFixed(3)}. `,
    'RWI = set reps (or seconds) × goal ÷ bodyweight on the day.'));

  if (!logs.length) {
    wrap.appendChild(el('p', { class: 'muted' }, 'No logged sets for this exercise yet.'));
    return wrap;
  }
  const card = el('div', { class: 'card' });
  for (const log of logs) {
    const w = weightOn(log.date, metrics);
    const perSet = log.actual?.reps ?? log.actual?.durationSec ?? log.actual?.movingSec ?? null;
    const sets = log.actual?.sets ?? 1;
    let rwiText = '—';
    if (perSet != null && w != null) {
      const rwi = perSet * (goal.targetWeight / w);
      rwiText = `RWI ${rwi.toFixed(1)}/set${sets > 1 ? ` · total ${(rwi * sets).toFixed(1)}` : ''}`;
    }
    card.appendChild(el('div', { class: 'list-row' },
      el('div', { class: 'row-main' },
        el('div', { class: 'row-title' }, rwiText),
        el('div', { class: 'row-sub' },
          `${formatDate(log.date, { month: 'short', day: 'numeric', year: 'numeric' })} · `
          + summarizeActual(log.actual)
          + (w != null ? ` · @ ${formatWeight(w)}` : '')),
      ),
    ));
  }
  wrap.appendChild(card);
  return wrap;
}

function summarizeActual(actual = {}) {
  const parts = [];
  if (actual.sets != null && actual.reps != null) parts.push(`${actual.sets} × ${actual.reps}`);
  if (actual.durationSec) parts.push(formatDuration(actual.durationSec));
  if (actual.distanceM) parts.push(formatDistance(actual.distanceM));
  if (actual.movingSec && !actual.durationSec) parts.push(formatDuration(actual.movingSec));
  return parts.join(' · ') || 'no data';
}

// ---------- Goals ----------

const fmtTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

function renderGoals() {
  const goals = store.get('goals');
  root.appendChild(el('div', { class: 'list-row' },
    el('h2', {}, 'Goals'),
    el('button', { class: 'btn small', onclick: () => editGoal(null) }, '+ New goal'),
  ));
  if (!goals.length) {
    root.appendChild(emptyState('No goals yet. Add a bodyweight target, a run time, or an exercise goal.'));
    return;
  }
  const exById = new Map(store.get('exercises').map((e) => [e.id, e]));
  for (const g of goals) root.appendChild(goalCard(g, exById));
}

function goalCard(goal, exById) {
  let title = '';
  let progress = '';
  if (goal.type === 'bodyweight') {
    title = `Bodyweight: ${formatWeight(goal.targetWeight)}`;
    const current = weightOn(todayStr(), store.get('metrics'));
    if (current != null) {
      const diff = current - goal.targetWeight;
      progress = `current ${formatWeight(current)} · ${diff > 0 ? formatWeight(Math.abs(diff)) + ' to lose' : diff < 0 ? formatWeight(Math.abs(diff)) + ' to gain' : 'at goal 🎉'}`;
    } else {
      progress = 'no body weight logged yet';
    }
  } else if (goal.type === 'runTime') {
    const preset = RUN_GOAL_PRESETS.find((p) => p.distanceM === goal.distanceM);
    title = `${preset?.label ?? formatDistance(goal.distanceM)} in ${fmtTime(goal.targetSec)}`;
    const best = bestRunEffort(goal.distanceM);
    progress = best
      ? `best so far ${fmtTime(best.sec)} (${formatDate(best.date)})${best.sec <= goal.targetSec ? ' — goal met 🎉' : ` · ${fmtTime(best.sec - goal.targetSec)} to go`}`
      : 'no matching runs logged yet';
  } else {
    const ex = exById.get(goal.exerciseId);
    title = `${ex?.name ?? 'Exercise'}: ${targetSummary(goal.target)}`;
    const last = store.get('logs').filter((l) => l.exerciseId === goal.exerciseId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    progress = last ? `last: ${summarizeActual(last.actual)} (${formatDate(last.date)})` : 'not logged yet';
  }
  return el('div', { class: 'card tappable', onclick: () => editGoal(goal) },
    el('div', { class: 'list-row', style: 'border:none;padding:0' },
      el('div', { class: 'row-main' },
        el('div', { class: 'row-title' }, title),
        el('div', { class: 'row-sub' }, progress),
        goal.targetDate && el('div', { class: 'row-sub' }, `by ${formatDate(goal.targetDate, { month: 'short', day: 'numeric', year: 'numeric' })}`),
        goal.notes && el('div', { class: 'row-sub' }, goal.notes),
      ),
      el('span', { class: 'pill accent' }, goal.type === 'runTime' ? 'run time' : goal.type),
    ),
  );
}

// Fastest logged effort whose distance is within ±2.5% of the goal distance,
// across Strava activities and manual distance logs.
function bestRunEffort(distanceM) {
  const tol = distanceM * 0.025;
  let best = null;
  const consider = (d, sec, date) => {
    if (d == null || sec == null) return;
    if (Math.abs(d - distanceM) > tol) return;
    // Normalize to exact goal distance by pace so 5.05 km counts fairly.
    const normalized = sec * (distanceM / d);
    if (!best || normalized < best.sec) best = { sec: Math.round(normalized), date };
  };
  for (const e of store.getStravaEntries()) consider(e.distanceM, e.movingSec, e.date);
  for (const l of store.get('logs')) consider(l.actual?.distanceM, l.actual?.movingSec, l.date);
  return best;
}

function editGoal(goal) {
  const isNew = !goal;
  const draft = goal ? { ...goal } : makeGoal();
  let pickedExercise = draft.exerciseId ? store.get('exercises').find((e) => e.id === draft.exerciseId) : null;

  const typeSel = el('select', {},
    el('option', { value: 'bodyweight', selected: draft.type === 'bodyweight' }, 'Bodyweight'),
    el('option', { value: 'runTime', selected: draft.type === 'runTime' }, 'Run time'),
    el('option', { value: 'exercise', selected: draft.type === 'exercise' }, 'Exercise'),
  );
  const dateInput = el('input', { type: 'date', value: draft.targetDate ?? '' });
  const notesInput = el('input', { value: draft.notes ?? '', placeholder: 'optional' });
  const fields = el('div', {});
  const field = (label, input) => el('div', { class: 'field' }, el('label', {}, label), input);
  const num = (name, value, step = 1) =>
    el('input', { type: 'number', inputmode: 'decimal', step, value: value ?? '', dataset: { name } });

  function renderFields() {
    const type = typeSel.value;
    fields.innerHTML = '';
    if (type === 'bodyweight') {
      fields.append(field(`Target weight (${weightUnit()})`, num('weight', weightToInput(draft.targetWeight) ?? '', 0.5)));
    } else if (type === 'runTime') {
      const presetSel = el('select', { dataset: { name: 'preset' } },
        RUN_GOAL_PRESETS.map((p) => el('option', { value: p.distanceM, selected: draft.distanceM === p.distanceM }, p.label)),
        el('option', { value: 'custom', selected: draft.distanceM != null && !RUN_GOAL_PRESETS.some((p) => p.distanceM === draft.distanceM) }, 'Custom…'),
      );
      const customWrap = el('div', { class: 'field', hidden: presetSel.value !== 'custom' },
        el('label', {}, `Distance (${distanceUnit()})`),
        num('customDist', draft.distanceM ? distanceToInput(draft.distanceM) : '', 0.1));
      presetSel.addEventListener('change', () => { customWrap.hidden = presetSel.value !== 'custom'; });
      const totalSec = draft.targetSec ?? 0;
      fields.append(
        field('Distance', presetSel),
        customWrap,
        el('div', { class: 'field-row' },
          field('Target minutes', num('goalMin', totalSec ? Math.floor(totalSec / 60) : '')),
          field('Seconds', num('goalSec', totalSec ? Math.round(totalSec % 60) : '')),
        ),
      );
    } else {
      const pickBtn = el('button', {
        class: 'btn secondary small',
        onclick: () => pickExercise((ex) => {
          pickedExercise = ex;
          pickBtn.textContent = ex.name;
        }),
      }, pickedExercise?.name ?? 'Pick exercise…');
      fields.append(
        el('div', { class: 'field' }, el('label', {}, 'Exercise'), pickBtn),
        el('div', { class: 'field-row' },
          field('Sets', num('sets', draft.target?.sets ?? '')),
          field('Reps', num('reps', draft.target?.reps ?? '')),
          field(`Weight (${weightUnit()})`, num('exWeight', weightToInput(draft.target?.weight) ?? '', 0.5)),
        ),
        el('div', { class: 'field-row' },
          field('Duration (min)', num('durMin', draft.target?.durationSec ? draft.target.durationSec / 60 : '')),
          field(`Distance (${distanceUnit()})`, num('dist', draft.target?.distanceM ? distanceToInput(draft.target.distanceM) : '', 0.1)),
        ),
      );
    }
  }
  typeSel.addEventListener('change', renderFields);
  renderFields();

  const actions = [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Save',
      class: 'btn',
      onClick: () => {
        const val = (n) => {
          const v = parseFloat(fields.querySelector(`[data-name="${n}"]`)?.value);
          return isNaN(v) ? null : v;
        };
        const type = typeSel.value;
        draft.type = type;
        draft.targetDate = dateInput.value || null;
        draft.notes = notesInput.value.trim();
        if (type === 'bodyweight') {
          const w = val('weight');
          if (w == null) { toast('Enter a target weight', 'error'); return false; }
          draft.targetWeight = weightFromInput(w);
        } else if (type === 'runTime') {
          const presetSel = fields.querySelector('[data-name="preset"]');
          draft.distanceM = presetSel.value === 'custom'
            ? (val('customDist') != null ? distanceFromInput(val('customDist')) : null)
            : Number(presetSel.value);
          const sec = (val('goalMin') ?? 0) * 60 + (val('goalSec') ?? 0);
          if (!draft.distanceM || !sec) { toast('Enter a distance and target time', 'error'); return false; }
          draft.targetSec = Math.round(sec);
        } else {
          if (!pickedExercise) { toast('Pick an exercise', 'error'); return false; }
          draft.exerciseId = pickedExercise.id;
          const target = {};
          if (val('reps') != null) { target.kind = 'reps'; target.reps = val('reps'); if (val('sets') != null) target.sets = val('sets'); if (val('exWeight') != null) target.weight = weightFromInput(val('exWeight')); }
          else if (val('durMin') != null) { target.kind = 'duration'; target.durationSec = Math.round(val('durMin') * 60); }
          else if (val('dist') != null) { target.kind = 'distance'; target.distanceM = distanceFromInput(val('dist')); }
          if (!target.kind) { toast('Enter a target (reps, duration, or distance)', 'error'); return false; }
          draft.target = target;
        }
        store.upsert('goals', draft);
        render();
      },
    },
  ];
  if (!isNew) {
    actions.unshift({
      label: 'Delete',
      class: 'btn danger',
      onClick: async () => {
        if (!(await confirmDialog('Delete this goal?'))) return false;
        store.remove('goals', draft.id);
        render();
      },
    });
  }
  openModal(isNew ? 'New goal' : 'Edit goal', el('div', {},
    el('div', { class: 'field' }, el('label', {}, 'Goal type'), typeSel),
    fields,
    el('div', { class: 'field-row' },
      el('div', { class: 'field' }, el('label', {}, 'Target date (optional)'), dateInput),
      el('div', { class: 'field' }, el('label', {}, 'Notes'), notesInput),
    ),
  ), actions);
}
