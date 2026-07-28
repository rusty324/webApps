// Factories for the app's record shapes. Every collection file is an array
// of objects with a unique `id`, which the store's merge logic relies on.

import { todayStr } from './dates.js';

const uid = () => crypto.randomUUID();

export function makePlan({ name = '', type = 'strength', startDate = todayStr() } = {}) {
  return {
    id: uid(),
    name,
    type, // 'strength' | 'running' | free text
    status: 'active', // 'active' | 'archived'
    startDate, // YYYY-MM-DD; anchors session dayOffsets to calendar dates
    sessions: [], // ordered
  };
}

export function makeSession({ label = '', dayOffset = 0 } = {}) {
  return {
    id: uid(),
    label, // display only, e.g. 'Week 1 · Day 2'
    dayOffset, // days from plan.startDate; scheduling source of truth
    plannedExercises: [], // ordered
  };
}

export function makePlannedExercise({ sessionId, exerciseId, target = {}, order = 0 } = {}) {
  return {
    id: uid(),
    sessionId,
    exerciseId,
    // target.kind: 'reps' -> {sets, reps, weight?}
    //             'distance' -> {distanceM, paceSecPerKm?}
    //             'duration' -> {durationSec}
    target,
    order,
  };
}

export function makeExercise({ name = '', category = 'strength', defaultUnit = 'reps' } = {}) {
  return {
    id: uid(),
    name,
    category, // one of config CATEGORIES
    defaultUnit, // 'reps' | 'duration' | 'distance'
  };
}

export function makeLogEntry({
  date = todayStr(),
  planId = null,
  plannedExerciseId = null,
  exerciseId = null,
  actual = {},
  notes = '',
  rpe = null,
  source = 'manual',
} = {}) {
  return {
    id: uid(),
    date,
    planId,
    plannedExerciseId, // null = ad-hoc
    exerciseId,
    // actual: same shape family as target — {sets, reps, weight?} or
    // {distanceM, movingSec, avgHr?} or {durationSec}
    actual,
    notes,
    rpe, // 1-10 or null
    source, // 'manual' | 'strava'
  };
}

// One record per weigh-in/measurement session; every metric field is
// optional (see BODY_METRICS in config.js for the recordable set).
export function makeBodyMetric({
  date = todayStr(),
  weight = null, // kg
  bodyFat = null, // %
  restingHr = null, // bpm
  waist = null, // cm
  notes = '',
} = {}) {
  return { id: uid(), date, weight, bodyFat, restingHr, waist, notes };
}

// A Strava activity record as written by scripts/strava-sync.mjs. The browser
// never writes these; match status lives in the matches overlay instead.
// Shape: { id: 'strava-<activityId>', stravaId, date, name, type, category-agnostic
//          distanceM, movingSec, avgHr, gpsPolyline, source: 'strava' }

// matches.json overlay record:
export function makeMatch({ stravaId, status, planId = null, plannedExerciseId = null, sessionId = null } = {}) {
  return {
    id: `match-${stravaId}`,
    stravaId,
    status, // 'suggested' | 'confirmed' | 'rejected'
    planId,
    sessionId,
    plannedExerciseId,
  };
}
