// Logs tab: Today (log against the active plan), History (with Strava
// match suggestions), Metrics (weight/pace charts + adherence), Heatmap.

import * as store from '../storage/store.js';
import { makeLogEntry, makeBodyMetric, makeMatch } from '../models.js';
import { findSuggestions, findCandidates } from '../matcher.js';
import { STRAVA_TYPE_MAP, BODY_METRICS } from '../config.js';
import {
  todayStr, addDays, diffDays, formatDate, formatDateLong, formatDuration,
} from '../dates.js';
import {
  formatWeight, formatDistance, formatPace, paceChartValue, paceUnit,
  weightUnit, weightToInput, weightFromInput,
  distanceUnit, distanceToInput, distanceFromInput, resolveMetric,
} from '../units.js';
import { lineChart, datePoints } from '../charts.js';
import { el, openModal, confirmDialog, toast, emptyState } from './components.js';
import { pickExercise, targetSummary } from './plans-tab.js';

let root = null;
let unsub = null;
let sub = 'today'; // 'today' | 'history' | 'metrics' | 'heatmap'
let histFilter = { from: addDays(todayStr(), -30), to: todayStr(), planId: '' };
let adherenceDays = 30;
let heatmapMod = null;

export function mount(elRoot) {
  root = elRoot;
  unsub = store.onChange((e) => {
    if (e.type === 'changed') render();
  });
  runMatcher();
  render();
}

export function unmount() {
  unsub?.();
  heatmapMod?.destroy?.();
  root = null;
}

// Persist fresh suggestions so they survive reloads and are never recomputed
// once the user confirms/rejects them.
function runMatcher() {
  const strava = store.getStravaEntries();
  if (!strava.length) return;
  const matches = store.get('matches');
  const fresh = findSuggestions(strava, store.get('plans'), matches, store.get('exercises'));
  if (fresh.length) {
    const records = matches.concat(fresh.map((f) => makeMatch({ ...f, status: 'suggested' })));
    store.save('matches', records);
  }
}

function render() {
  if (!root) return;
  heatmapMod?.destroy?.();
  root.innerHTML = '';
  const segs = [
    ['today', 'Today'],
    ['history', 'History'],
    ['metrics', 'Metrics'],
    ['heatmap', 'Heatmap'],
  ];
  root.appendChild(el('div', { class: 'segmented' },
    segs.map(([id, label]) =>
      el('button', { class: sub === id ? 'active' : '', onclick: () => { sub = id; render(); } }, label)),
  ));
  if (sub === 'today') renderToday();
  else if (sub === 'history') renderHistory();
  else if (sub === 'metrics') renderMetrics();
  else renderHeatmap();
}

// ---------- helpers ----------

function exById() {
  return new Map(store.get('exercises').map((e) => [e.id, e]));
}

function activePlans() {
  return store.get('plans').filter((p) => p.status === 'active');
}

// Strava entries decorated with their computed matchStatus (overlay merge).
function stravaWithStatus() {
  const matches = new Map(store.get('matches').map((m) => [m.stravaId, m]));
  return store.getStravaEntries().map((entry) => {
    const m = matches.get(entry.stravaId);
    return {
      ...entry,
      matchStatus: m?.status ?? 'unmatched',
      match: m ?? null,
    };
  });
}

export function actualSummary(actual) {
  if (!actual) return '';
  const parts = [];
  if (actual.sets != null && actual.reps != null) {
    parts.push(`${actual.sets} × ${actual.reps}${actual.weight ? ` @ ${formatWeight(actual.weight)}` : ''}`);
  }
  if (actual.distanceM) parts.push(formatDistance(actual.distanceM));
  if (actual.movingSec) parts.push(formatDuration(actual.movingSec));
  if (actual.distanceM && actual.movingSec) parts.push(formatPace(actual.distanceM, actual.movingSec));
  if (actual.durationSec) parts.push(formatDuration(actual.durationSec));
  if (actual.avgHr) parts.push(`${Math.round(actual.avgHr)} bpm`);
  return parts.join(' · ');
}

// ---------- Today ----------

function renderToday() {
  const today = todayStr();
  const lib = exById();
  const logs = store.get('logs');
  const loggedByPe = new Map(
    logs.filter((l) => l.date === today && l.plannedExerciseId).map((l) => [l.plannedExerciseId, l]),
  );

  root.appendChild(el('h2', {}, formatDateLong(today)));
  root.appendChild(weighInCard(today));

  let anyPlanned = false;
  for (const plan of activePlans()) {
    for (const session of plan.sessions) {
      if (addDays(plan.startDate, session.dayOffset) !== today) continue;
      anyPlanned = true;
      const card = el('div', { class: 'card' },
        el('div', { class: 'row-title' }, session.label || plan.name),
        el('div', { class: 'row-sub' }, plan.name),
      );
      for (const pe of [...session.plannedExercises].sort((a, b) => a.order - b.order)) {
        card.appendChild(plannedRow(plan, session, pe, lib.get(pe.exerciseId), loggedByPe.get(pe.id)));
      }
      if (!session.plannedExercises.length) card.appendChild(el('p', { class: 'muted' }, 'Session has no exercises.'));
      root.appendChild(card);
    }
  }
  if (!anyPlanned) {
    root.appendChild(el('div', { class: 'card' },
      el('p', { class: 'muted', style: 'margin:0' }, 'Nothing planned for today.'),
    ));
  }
  root.appendChild(el('button', { class: 'btn', onclick: () => adhocLog() }, '+ Log ad-hoc activity'));
}

// One-tap daily weigh-in. Prefills the last known weight; merges into
// today's metric record if one already exists (no duplicate same-day rows).
function weighInCard(today) {
  const metrics = store.get('metrics');
  const todays = metrics.find((m) => m.date === today);

  if (todays?.weight != null) {
    return el('div', { class: 'card' },
      el('div', { class: 'list-row', style: 'border:none;padding:0' },
        el('div', { class: 'row-main' },
          el('div', { class: 'row-title' }, `${formatWeight(todays.weight)} `, el('span', { class: 'pill ok' }, 'weighed in')),
          metricSummary(todays) !== formatWeight(todays.weight) && el('div', { class: 'row-sub' }, metricSummary(todays)),
        ),
        el('button', { class: 'btn small secondary', onclick: () => logBodyMetric(todays) }, 'Edit'),
      ),
    );
  }

  const last = [...metrics].filter((m) => m.weight != null).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const input = el('input', {
    type: 'number', inputmode: 'decimal', step: 0.1,
    value: weightToInput(last?.weight) ?? '', placeholder: weightUnit(), 'aria-label': `Weight (${weightUnit()})`,
  });
  const save = () => {
    const w = parseFloat(input.value);
    if (isNaN(w)) { toast('Enter a weight', 'error'); return; }
    const kg = weightFromInput(w);
    const entry = todays ? { ...todays, weight: kg } : makeBodyMetric({ date: today, weight: kg });
    store.upsert('metrics', entry);
    toast('Weight logged');
  };
  return el('div', { class: 'card' },
    el('div', { class: 'row-sub', style: 'margin-bottom:6px' }, 'Morning weigh-in'),
    el('div', { class: 'log-inputs', style: 'margin:0' },
      input,
      el('button', { class: 'btn small', onclick: save }, 'Log'),
      el('button', { class: 'btn small secondary', onclick: () => logBodyMetric(todays ?? null) }, 'More…'),
    ),
  );
}

function plannedRow(plan, session, pe, ex, existing) {
  const row = el('div', { class: 'list-row' });
  const main = el('div', { class: 'row-main' },
    el('div', { class: 'row-title' }, ex?.name ?? '?'),
    el('div', { class: 'row-sub' }, `Target: ${targetSummary(pe.target)}`),
  );
  if (existing) {
    main.appendChild(el('div', { class: 'row-sub' },
      el('span', { class: 'pill ok' }, 'done'), ' ', actualSummary(existing.actual),
      existing.rpe ? ` · RPE ${existing.rpe}` : ''));
    row.append(main, el('div', { class: 'row-actions' },
      el('button', { class: 'btn small secondary', onclick: () => logEntryModal({ existing, plan, pe, ex }) }, 'Edit'),
    ));
  } else {
    row.append(main, el('div', { class: 'row-actions' },
      el('button', { class: 'btn small', onclick: () => logEntryModal({ plan, session, pe, ex }) }, 'Log'),
    ));
  }
  return row;
}

function adhocLog() {
  pickExercise((ex) => logEntryModal({ ex }));
}

// Shared entry modal for planned, ad-hoc, and edit flows.
function logEntryModal({ existing = null, plan = null, session = null, pe = null, ex = null }) {
  const entry = existing
    ? JSON.parse(JSON.stringify(existing))
    : makeLogEntry({
        planId: plan?.id ?? null,
        plannedExerciseId: pe?.id ?? null,
        exerciseId: ex?.id ?? null,
      });

  const kind = pe?.target?.kind ?? (ex?.defaultUnit === 'distance' ? 'distance' : ex?.defaultUnit === 'duration' ? 'duration' : 'reps');
  const a = entry.actual ?? {};
  const t = pe?.target ?? {};
  const dateInput = el('input', { type: 'date', value: entry.date });
  const fields = el('div', { class: 'field-row' });
  const num = (name, value, step = 1) =>
    el('input', { type: 'number', inputmode: 'decimal', step, value: value ?? '', dataset: { name } });
  const field = (label, input) => el('div', { class: 'field' }, el('label', {}, label), input);

  if (kind === 'reps') {
    fields.append(
      field('Sets', num('sets', a.sets ?? t.sets)),
      field('Reps', num('reps', a.reps ?? t.reps)),
      field(`Weight (${weightUnit()})`, num('weight', weightToInput(a.weight ?? t.weight) ?? '', 0.5)),
    );
  } else if (kind === 'distance') {
    fields.append(
      field(`Distance (${distanceUnit()})`, num('km', distanceToInput(a.distanceM ?? t.distanceM) ?? '', 0.01)),
      field('Time (min)', num('min', a.movingSec ? +(a.movingSec / 60).toFixed(1) : '', 0.5)),
    );
  } else {
    fields.append(field('Duration (min)', num('min', a.durationSec ? a.durationSec / 60 : (t.durationSec ? t.durationSec / 60 : ''), 1)));
  }

  const rpeInput = num('rpe', entry.rpe, 1);
  rpeInput.setAttribute('min', 1);
  rpeInput.setAttribute('max', 10);
  const notesInput = el('textarea', {}, entry.notes ?? '');

  const body = el('div', {},
    el('div', { class: 'field' }, el('label', {}, 'Date'), dateInput),
    fields,
    el('div', { class: 'field' }, el('label', {}, 'RPE (1–10, optional)'), rpeInput),
    el('div', { class: 'field' }, el('label', {}, 'Notes'), notesInput),
  );

  const actions = [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Save',
      class: 'btn',
      onClick: () => {
        const val = (n) => {
          const v = parseFloat(body.querySelector(`[data-name="${n}"]`)?.value);
          return isNaN(v) ? null : v;
        };
        const actual = {};
        if (kind === 'reps') {
          actual.sets = val('sets');
          actual.reps = val('reps');
          if (val('weight') != null) actual.weight = weightFromInput(val('weight'));
        } else if (kind === 'distance') {
          if (val('km') != null) actual.distanceM = distanceFromInput(val('km'));
          if (val('min') != null) actual.movingSec = Math.round(val('min') * 60);
        } else if (val('min') != null) {
          actual.durationSec = Math.round(val('min') * 60);
        }
        Object.assign(entry, {
          date: dateInput.value || todayStr(),
          actual,
          rpe: val('rpe'),
          notes: notesInput.value.trim(),
        });
        store.upsert('logs', entry);
        toast('Logged');
      },
    },
  ];
  if (existing) {
    actions.unshift({
      label: 'Delete',
      class: 'btn danger',
      onClick: async () => {
        if (!(await confirmDialog('Delete this log entry?'))) return false;
        store.remove('logs', entry.id);
      },
    });
  }
  openModal(ex?.name ?? 'Log activity', body, actions);
}

// ---------- History ----------

function renderHistory() {
  const lib = exById();
  const plans = store.get('plans');
  const planById = new Map(plans.map((p) => [p.id, p]));

  const fromIn = el('input', { type: 'date', value: histFilter.from, onchange: (e) => { histFilter.from = e.target.value; render(); } });
  const toIn = el('input', { type: 'date', value: histFilter.to, onchange: (e) => { histFilter.to = e.target.value; render(); } });
  const planSel = el('select', { onchange: (e) => { histFilter.planId = e.target.value; render(); } },
    el('option', { value: '' }, 'All plans'),
    plans.map((p) => el('option', { value: p.id, selected: histFilter.planId === p.id }, p.name)),
    el('option', { value: 'adhoc', selected: histFilter.planId === 'adhoc' }, 'Ad-hoc only'),
  );
  root.appendChild(el('div', { class: 'card' },
    el('div', { class: 'field-row' },
      el('div', { class: 'field', style: 'margin:0' }, el('label', {}, 'From'), fromIn),
      el('div', { class: 'field', style: 'margin:0' }, el('label', {}, 'To'), toIn),
      el('div', { class: 'field', style: 'margin:0' }, el('label', {}, 'Plan'), planSel),
    ),
  ));

  const inRange = (d) => (!histFilter.from || d >= histFilter.from) && (!histFilter.to || d <= histFilter.to);

  // Merge manual logs and Strava activities into one timeline.
  const items = [];
  for (const log of store.get('logs')) {
    if (!inRange(log.date)) continue;
    if (histFilter.planId === 'adhoc' && log.planId) continue;
    if (histFilter.planId && histFilter.planId !== 'adhoc' && log.planId !== histFilter.planId) continue;
    items.push({ kind: 'log', date: log.date, log });
  }
  if (!histFilter.planId || histFilter.planId === 'adhoc') {
    for (const entry of stravaWithStatus()) {
      if (!inRange(entry.date)) continue;
      if (histFilter.planId === 'adhoc' && entry.matchStatus === 'confirmed') continue;
      items.push({ kind: 'strava', date: entry.date, entry });
    }
  } else {
    for (const entry of stravaWithStatus()) {
      if (inRange(entry.date) && entry.matchStatus === 'confirmed' && entry.match.planId === histFilter.planId) {
        items.push({ kind: 'strava', date: entry.date, entry });
      }
    }
  }
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (!items.length) {
    root.appendChild(emptyState('No entries in this range.'));
    return;
  }
  const card = el('div', { class: 'card' });
  for (const item of items) {
    card.appendChild(item.kind === 'log' ? logRow(item.log, lib, planById) : stravaRow(item.entry, lib, planById));
  }
  root.appendChild(card);
}

function logRow(log, lib, planById) {
  const ex = lib.get(log.exerciseId);
  const plan = planById.get(log.planId);
  return el('div', { class: 'list-row' },
    el('div', { class: 'row-main tappable', onclick: () => logEntryModal({ existing: log, ex }) },
      el('div', { class: 'row-title' }, ex?.name ?? 'Activity'),
      el('div', { class: 'row-sub' },
        `${formatDate(log.date)} · ${actualSummary(log.actual)}${log.rpe ? ` · RPE ${log.rpe}` : ''}`),
      log.notes && el('div', { class: 'row-sub' }, log.notes),
    ),
    el('span', { class: `pill ${plan ? 'accent' : ''}` }, plan ? plan.name : 'ad-hoc'),
  );
}

function stravaRow(entry, lib, planById) {
  const statusPill = {
    unmatched: ['pill', 'unlinked'],
    suggested: ['pill warn', 'suggested'],
    confirmed: ['pill ok', 'linked'],
    rejected: ['pill', 'ad-hoc'],
  }[entry.matchStatus];

  const row = el('div', { class: 'list-row' },
    el('div', { class: 'row-main' },
      el('div', { class: 'row-title' }, entry.name || entry.type, ' ', el('span', { class: 'pill' }, 'strava')),
      el('div', { class: 'row-sub' }, `${formatDate(entry.date)} · ${actualSummary(entry)}`),
    ),
    el('span', { class: statusPill[0] }, statusPill[1]),
  );

  if (entry.matchStatus === 'suggested') {
    const target = describeMatch(entry.match, planById, lib);
    return el('div', {}, row, el('div', { class: 'list-row', style: 'border-top:none;padding-top:0' },
      el('div', { class: 'row-main' },
        el('div', { class: 'row-sub' }, `Suggested match: ${target}`)),
      el('div', { class: 'row-actions' },
        el('button', { class: 'btn small', onclick: () => decideMatch(entry, 'confirmed') }, 'Confirm'),
        el('button', { class: 'btn small secondary', onclick: () => decideMatch(entry, 'rejected') }, 'Reject'),
      ),
    ));
  }
  if (entry.matchStatus === 'unmatched') {
    return el('div', {}, row, el('div', { class: 'list-row', style: 'border-top:none;padding-top:0' },
      el('div', { class: 'row-main' }),
      el('button', { class: 'btn small secondary', onclick: () => manualLink(entry) }, 'Link to plan…'),
    ));
  }
  if (entry.matchStatus === 'confirmed') {
    row.querySelector('.row-main').appendChild(
      el('div', { class: 'row-sub' }, `↳ ${describeMatch(entry.match, planById, lib)}`),
    );
  }
  return row;
}

function describeMatch(match, planById, lib) {
  const plan = planById.get(match.planId);
  if (!plan) return 'a deleted plan';
  const session = plan.sessions.find((s) => s.id === match.sessionId);
  const pe = session?.plannedExercises.find((p) => p.id === match.plannedExerciseId);
  const ex = pe && lib.get(pe.exerciseId);
  return [plan.name, session?.label, ex?.name].filter(Boolean).join(' · ') || plan.name;
}

function decideMatch(entry, status) {
  const matches = store.get('matches').slice();
  const i = matches.findIndex((m) => m.stravaId === entry.stravaId);
  if (i >= 0) matches[i] = { ...matches[i], status };
  else matches.push(makeMatch({ stravaId: entry.stravaId, status }));
  store.save('matches', matches);
  toast(status === 'confirmed' ? 'Linked to plan' : 'Left as ad-hoc');
}

// Manual picker for ambiguous/unmatched entries: shows nearby candidates.
function manualLink(entry) {
  const lib = exById();
  const planById = new Map(store.get('plans').map((p) => [p.id, p]));
  const candidates = findCandidates(entry, activePlans(), lib, 7); // wide window for manual review
  const list = el('div', {});
  let modal;
  if (!candidates.length) {
    list.appendChild(el('p', { class: 'muted' },
      'No planned exercises of a matching type within a week of this activity.'));
  }
  for (const c of candidates.slice(0, 12)) {
    const date = addDays(c.plan.startDate, c.session.dayOffset);
    list.appendChild(el('div', { class: 'list-row tappable', onclick: () => {
      modal.close();
      const matches = store.get('matches').slice();
      const rec = makeMatch({
        stravaId: entry.stravaId, status: 'confirmed',
        planId: c.planId, sessionId: c.sessionId, plannedExerciseId: c.plannedExerciseId,
      });
      const i = matches.findIndex((m) => m.stravaId === entry.stravaId);
      if (i >= 0) matches[i] = rec;
      else matches.push(rec);
      store.save('matches', matches);
      toast('Linked to plan');
    } },
      el('div', { class: 'row-main' },
        el('div', { class: 'row-title' }, c.exercise.name),
        el('div', { class: 'row-sub' },
          `${c.plan.name} · ${c.session.label || 'session'} · ${formatDate(date)} · target ${targetSummary(c.plannedExercise.target)}`),
      ),
    ));
  }
  modal = openModal(`Link “${entry.name || entry.type}”`, list, [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    { label: 'Mark as ad-hoc', class: 'btn secondary', onClick: () => decideMatch(entry, 'rejected') },
  ]);
}

// ---------- Metrics ----------

function renderMetrics() {
  const metrics = [...store.get('metrics')].sort((a, b) => (a.date < b.date ? -1 : 1));

  // Adherence over the selected window.
  const { done, planned } = adherence(adherenceDays);
  const pct = planned ? Math.round((done / planned) * 100) : null;
  root.appendChild(el('div', { class: 'stat-row' },
    el('div', { class: 'stat-tile' },
      el('div', { class: 'stat-value' }, pct == null ? '—' : `${pct}%`),
      el('div', { class: 'stat-label' }, `adherence · ${done}/${planned} planned`),
    ),
    el('div', { class: 'stat-tile' },
      el('div', { class: 'stat-value' }, String(logCount(adherenceDays))),
      el('div', { class: 'stat-label' }, `activities · last ${adherenceDays}d`),
    ),
  ));
  root.appendChild(el('div', { class: 'segmented' },
    [7, 30, 90].map((d) => el('button', {
      class: adherenceDays === d ? 'active' : '',
      onclick: () => { adherenceDays = d; render(); },
    }, `${d} days`)),
  ));

  // Body metrics: weight chart always, other metrics only once they have
  // enough data to draw a trend.
  root.appendChild(el('div', { class: 'list-row' },
    el('h3', {}, 'Body weight'),
    el('button', { class: 'btn small', onclick: () => logBodyMetric() }, '+ Log metrics'),
  ));
  for (const m of BODY_METRICS) {
    const res = resolveMetric(m);
    const points = datePoints(
      metrics.filter((r) => r[m.id] != null),
      (r) => res.toInput(r[m.id]),
      (r) => `${r.date}: ${res.toInput(r[m.id])} ${res.unit}`,
    );
    if (m.id !== 'weight' && points.length < 2) continue;
    if (m.id !== 'weight') root.appendChild(el('h3', {}, m.label));
    root.appendChild(lineChart({
      points,
      yLabel: res.unit,
      yFormat: (v) => (res.step >= 1 ? String(Math.round(v)) : v.toFixed(1)),
    }));
  }

  // Running pace + distance from all sources
  const runs = runningActivities();
  root.appendChild(el('h3', {}, 'Running pace'));
  root.appendChild(lineChart({
    points: datePoints(runs.filter((r) => r.distanceM && r.movingSec),
      (r) => paceChartValue(r.distanceM, r.movingSec),
      (r) => `${r.date}: ${formatPace(r.distanceM, r.movingSec)} · ${formatDistance(r.distanceM)}`),
    yLabel: `min${paceUnit()} (lower = faster)`,
    yFormat: (v) => v.toFixed(1),
    invertY: true,
  }));
  root.appendChild(el('h3', {}, 'Running distance'));
  root.appendChild(lineChart({
    points: datePoints(runs.filter((r) => r.distanceM),
      (r) => distanceToInput(r.distanceM),
      (r) => `${r.date}: ${formatDistance(r.distanceM)}`),
    yLabel: distanceUnit(),
    yFormat: (v) => v.toFixed(1),
  }));

  if (metrics.length) {
    const card = el('div', { class: 'card' }, el('h3', {}, 'Recent entries'));
    for (const m of [...metrics].reverse().slice(0, 10)) {
      card.appendChild(el('div', { class: 'list-row' },
        el('div', { class: 'row-main tappable', onclick: () => logBodyMetric(m) },
          el('div', { class: 'row-title' }, metricSummary(m) || '—'),
          el('div', { class: 'row-sub' }, formatDate(m.date, { month: 'short', day: 'numeric', year: 'numeric' }), m.notes ? ` · ${m.notes}` : ''),
        ),
      ));
    }
    root.appendChild(card);
  }
}

function runningActivities() {
  const out = [];
  for (const e of store.getStravaEntries()) {
    if ((STRAVA_TYPE_MAP[e.type] ?? 'other') === 'running') out.push(e);
  }
  const lib = exById();
  for (const l of store.get('logs')) {
    const ex = lib.get(l.exerciseId);
    if (ex?.category === 'running' && l.actual?.distanceM) {
      out.push({ date: l.date, distanceM: l.actual.distanceM, movingSec: l.actual.movingSec });
    }
  }
  return out;
}

function logCount(days) {
  const from = addDays(todayStr(), -days);
  return store.get('logs').filter((l) => l.date >= from).length
    + store.getStravaEntries().filter((e) => e.date >= from).length;
}

// Planned exercises due in [today-days, today] vs. those actually completed
// (a linked manual log, or a confirmed Strava match).
function adherence(days) {
  const from = addDays(todayStr(), -days);
  const to = todayStr();
  const loggedPe = new Set(store.get('logs').filter((l) => l.plannedExerciseId).map((l) => l.plannedExerciseId));
  const confirmedPe = new Set(store.get('matches').filter((m) => m.status === 'confirmed' && m.plannedExerciseId).map((m) => m.plannedExerciseId));
  let planned = 0;
  let done = 0;
  for (const plan of activePlans()) {
    for (const session of plan.sessions) {
      const d = addDays(plan.startDate, session.dayOffset);
      if (d < from || d > to) continue;
      for (const pe of session.plannedExercises) {
        planned++;
        if (loggedPe.has(pe.id) || confirmedPe.has(pe.id)) done++;
      }
    }
  }
  return { done, planned };
}

function logBodyMetric(existing = null) {
  const entry = existing ? { ...existing } : makeBodyMetric();
  const dateIn = el('input', { type: 'date', value: entry.date });
  const inputs = new Map(BODY_METRICS.map((m) => {
    const res = resolveMetric(m);
    return [m.id, el('input', {
      type: 'number', inputmode: 'decimal', step: res.step,
      value: res.toInput(entry[m.id]) ?? '',
    })];
  }));
  const notesIn = el('input', { value: entry.notes ?? '', placeholder: 'optional' });
  const actions = [
    { label: 'Cancel', class: 'btn secondary', onClick: () => {} },
    {
      label: 'Save',
      class: 'btn',
      onClick: () => {
        const values = {};
        for (const m of BODY_METRICS) {
          const v = parseFloat(inputs.get(m.id).value);
          values[m.id] = isNaN(v) ? null : resolveMetric(m).fromInput(v);
        }
        if (Object.values(values).every((v) => v == null)) {
          toast('Enter at least one measurement', 'error');
          return false;
        }
        Object.assign(entry, values, { date: dateIn.value || todayStr(), notes: notesIn.value.trim() });
        store.upsert('metrics', entry);
      },
    },
  ];
  if (existing) {
    actions.unshift({
      label: 'Delete', class: 'btn danger',
      onClick: async () => {
        if (!(await confirmDialog('Delete this entry?'))) return false;
        store.remove('metrics', entry.id);
      },
    });
  }
  const metricFields = BODY_METRICS.map((m) =>
    el('div', { class: 'field' }, el('label', {}, `${m.label} (${resolveMetric(m).unit})`), inputs.get(m.id)));
  openModal('Body metrics', el('div', {},
    el('div', { class: 'field' }, el('label', {}, 'Date'), dateIn),
    el('div', { class: 'field-row' }, metricFields.slice(0, 2)),
    el('div', { class: 'field-row' }, metricFields.slice(2)),
    el('div', { class: 'field' }, el('label', {}, 'Notes'), notesIn),
  ), actions);
}

// Summary like "82.0 kg · 15.2 % · 48 bpm" for the entries list,
// in the user's display units.
function metricSummary(entry) {
  return BODY_METRICS
    .filter((m) => entry[m.id] != null)
    .map((m) => {
      const res = resolveMetric(m);
      return `${res.toInput(entry[m.id])} ${res.unit}`;
    })
    .join(' · ');
}

// ---------- Heatmap ----------

async function renderHeatmap() {
  const container = el('div', { class: 'heatmap-container' }, el('p', { class: 'muted', style: 'padding:16px' }, 'Loading map…'));
  root.appendChild(container);
  const entries = store.getStravaEntries().filter((e) => e.gpsPolyline);
  if (!entries.length) {
    container.innerHTML = '';
    container.appendChild(emptyState('No GPS routes yet. They arrive with synced Strava activities.'));
    return;
  }
  const mod = await import('./heatmap-view.js');
  heatmapMod = await mod.show(container, entries);
}
