// Central app configuration. Adding a tab = add an entry to TABS and create
// a module exporting mount(el, ctx) / unmount().

export const TABS = [
  { id: 'plans', label: 'Plans', module: new URL('./ui/plans-tab.js', import.meta.url).href },
  { id: 'logs', label: 'Logs', module: new URL('./ui/logs-tab.js', import.meta.url).href },
  { id: 'library', label: 'Fitness Library', module: new URL('./ui/library-tab.js', import.meta.url).href },
];

export const DEFAULT_TAB = 'logs';

// Where the app itself is served from (public). Shown in Settings; the app
// never writes here.
export const APP_REPO = {
  owner: 'rusty324',
  repo: 'webApps',
  branch: 'fitnessTracker',
};

// Where personal data is stored — a SEPARATE PRIVATE repo, configured at
// runtime in Settings and kept in localStorage. Deliberately unset by
// default: with no data repo the app stays local-only rather than writing
// personal data somewhere public by accident. See README → "Where your
// data lives".
export const DATA_REPO_DEFAULT = null;

// Data files, relative to repo root. The browser owns all of these.
// data/strava/** is owned by the Actions sync workflow and is read-only here.
export const DATA_FILES = {
  plans: 'data/plans.json',
  exercises: 'data/exercises.json',
  logs: 'data/logs.json',
  metrics: 'data/metrics.json',
  matches: 'data/matches.json',
  goals: 'data/goals.json',
};
export const STRAVA_DIR = 'data/strava';

// Exercise taxonomy, aligned with the fitness-tracker-plan v2 schema.
export const CATEGORIES = ['cardio', 'strength', 'mobility', 'plyometric', 'skill', 'other'];
export const MODALITIES = ['run', 'walk', 'bike', 'swim', 'row', 'bodyweight', 'barbell', 'dumbbell', 'machine', 'band', 'stretch', 'mobility', 'other'];
export const MEASUREMENT_TYPES = ['reps', 'duration', 'distance', 'intervals'];

// Strava activity type -> exercise taxonomy, for fuzzy matching. When a
// modality is given the matcher prefers it; category is the fallback.
export const STRAVA_TYPE_MAP = {
  Run: { category: 'cardio', modality: 'run' },
  TrailRun: { category: 'cardio', modality: 'run' },
  VirtualRun: { category: 'cardio', modality: 'run' },
  Walk: { category: 'cardio', modality: 'walk' },
  Hike: { category: 'cardio', modality: 'walk' },
  Ride: { category: 'cardio', modality: 'bike' },
  MountainBikeRide: { category: 'cardio', modality: 'bike' },
  GravelRide: { category: 'cardio', modality: 'bike' },
  VirtualRide: { category: 'cardio', modality: 'bike' },
  EBikeRide: { category: 'cardio', modality: 'bike' },
  Rowing: { category: 'cardio', modality: 'row' },
  Swim: { category: 'cardio', modality: 'swim' },
  WeightTraining: { category: 'strength' },
  Workout: { category: 'strength' },
  Crossfit: { category: 'strength' },
};

// Fuzzy matcher: how many days a plan session may differ from the
// activity date and still be considered a candidate.
export const MATCH_WINDOW_DAYS = 1;

export const TARGET_KINDS = [
  { id: 'reps', label: 'Sets × Reps' },
  { id: 'distance', label: 'Distance / Pace' },
  { id: 'duration', label: 'Duration' },
  { id: 'intervals', label: 'Intervals' },
];

// Presets for run-time goals (Fitness Library → Goals).
export const RUN_GOAL_PRESETS = [
  { label: '1 mile', distanceM: 1609 },
  { label: '5k', distanceM: 5000 },
  { label: '10k', distanceM: 10000 },
  { label: 'Half marathon', distanceM: 21097 },
  { label: 'Marathon', distanceM: 42195 },
];

export const SYNC_WORKFLOW_FILE = 'strava-sync.yml';

// Body metrics the Metrics view can record. Adding a metric here is all
// that's needed — the entry modal, charts, and history list derive from it.
// unit/step are the metric (canonical) defaults; entries with a `dimension`
// are shown in the user's preferred unit via units.js resolveMetric().
export const BODY_METRICS = [
  { id: 'weight', label: 'Weight', unit: 'kg', step: 0.1, dimension: 'weight' },
  { id: 'bodyFat', label: 'Body fat', unit: '%', step: 0.1, dimension: null },
  { id: 'restingHr', label: 'Resting HR', unit: 'bpm', step: 1, dimension: null },
  { id: 'waist', label: 'Waist', unit: 'cm', step: 0.5, dimension: 'length' },
];
