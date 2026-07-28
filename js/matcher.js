// Fuzzy matcher: pairs unhandled Strava activities with planned exercises.
// Pure functions — no DOM, no storage — so it's trivially unit-testable.
// Runs client-side on Logs load, so it stays correct when plans are edited
// after a sync has already happened.

import { STRAVA_TYPE_MAP, MATCH_WINDOW_DAYS } from './config.js';
import { addDays, diffDays } from './dates.js';

// Returns [{stravaId, planId, sessionId, plannedExerciseId, score}] of NEW
// suggestions — activities that already have a match record (suggested/
// confirmed/rejected) are skipped, so user decisions are terminal.
export function findSuggestions(stravaEntries, plans, matches, exercises, windowDays = MATCH_WINDOW_DAYS) {
  const handled = new Set(matches.map((m) => m.stravaId));
  const exById = new Map(exercises.map((e) => [e.id, e]));
  const out = [];
  for (const entry of stravaEntries) {
    if (handled.has(entry.stravaId)) continue;
    const candidates = findCandidates(entry, plans, exById, windowDays);
    const best = pickWinner(candidates);
    if (best) {
      out.push({
        stravaId: entry.stravaId,
        planId: best.planId,
        sessionId: best.sessionId,
        plannedExerciseId: best.plannedExerciseId,
        score: best.score,
      });
    }
  }
  return out;
}

// All plausible planned exercises for one activity (used both by the
// auto-matcher and by the manual "link to plan" picker).
export function findCandidates(entry, plans, exById, windowDays = MATCH_WINDOW_DAYS) {
  const category = STRAVA_TYPE_MAP[entry.type] ?? 'other';
  const candidates = [];
  for (const plan of plans) {
    if (plan.status !== 'active') continue;
    for (const session of plan.sessions) {
      const sessionDate = addDays(plan.startDate, session.dayOffset);
      const dayDiff = Math.abs(diffDays(sessionDate, entry.date));
      if (dayDiff > windowDays) continue;
      for (const pe of session.plannedExercises) {
        const ex = exById.get(pe.exerciseId);
        if (!ex || ex.category !== category) continue;
        candidates.push({
          planId: plan.id,
          sessionId: session.id,
          plannedExerciseId: pe.id,
          plan,
          session,
          plannedExercise: pe,
          exercise: ex,
          score: score(entry, pe, dayDiff),
        });
      }
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

// Date proximity dominates; distance/duration similarity break ties.
function score(entry, pe, dayDiff) {
  let s = 1 / (1 + dayDiff);
  const t = pe.target ?? {};
  if (entry.distanceM && t.distanceM) s += ratioSim(entry.distanceM, t.distanceM);
  if (entry.movingSec && t.durationSec) s += ratioSim(entry.movingSec, t.durationSec);
  return s;
}

function ratioSim(a, b) {
  return Math.min(a, b) / Math.max(a, b); // 1 = identical, → 0 as they diverge
}

// A single candidate wins outright; with several, only a clear winner
// (≥2× the runner-up's score) is auto-suggested. Otherwise the activity is
// left unmatched for manual linking.
function pickWinner(candidates) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  return candidates[0].score >= 2 * candidates[1].score ? candidates[0] : null;
}
