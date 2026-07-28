// Central app configuration. Adding a tab = add an entry to TABS and create
// a module exporting mount(el, ctx) / unmount().

// Module URLs are resolved against this file so dynamic import() works the
// same regardless of which module triggers the load.
export const TABS = [
  { id: 'plans', label: 'Plans', module: new URL('./ui/plans-tab.js', import.meta.url).href },
  { id: 'logs', label: 'Logs', module: new URL('./ui/logs-tab.js', import.meta.url).href },
];

export const DEFAULT_TAB = 'logs';

// Repo the GitHub Contents API writes to. Owner/repo are derived from the
// Pages hostname when possible so a fork keeps working; override here if not.
export const REPO = {
  owner: 'rusty324',
  repo: 'webApps',
  branch: 'fitnessTracker',
};

// Data files, relative to repo root. The browser owns all of these.
// data/strava/** is owned by the Actions sync workflow and is read-only here.
export const DATA_FILES = {
  plans: 'data/plans.json',
  exercises: 'data/exercises.json',
  logs: 'data/logs.json',
  metrics: 'data/metrics.json',
  matches: 'data/matches.json',
};
export const STRAVA_DIR = 'data/strava';

// Exercise categories. stravaTypeMap maps Strava activity type/sport_type
// values onto them for fuzzy matching.
export const CATEGORIES = ['running', 'cycling', 'strength', 'swimming', 'other'];

export const STRAVA_TYPE_MAP = {
  Run: 'running',
  TrailRun: 'running',
  VirtualRun: 'running',
  Walk: 'running',
  Hike: 'running',
  Ride: 'cycling',
  MountainBikeRide: 'cycling',
  GravelRide: 'cycling',
  VirtualRide: 'cycling',
  EBikeRide: 'cycling',
  WeightTraining: 'strength',
  Workout: 'strength',
  Crossfit: 'strength',
  Swim: 'swimming',
};

// Fuzzy matcher: how many days a plan session may differ from the
// activity date and still be considered a candidate.
export const MATCH_WINDOW_DAYS = 1;

// Units per target kind, used by planned-exercise editors and log inputs.
export const TARGET_KINDS = [
  { id: 'reps', label: 'Sets × Reps' },
  { id: 'distance', label: 'Distance / Pace' },
  { id: 'duration', label: 'Duration' },
];

export const SYNC_WORKFLOW_FILE = 'strava-sync.yml';

// Body metrics the Metrics view can record. Adding a metric here is all
// that's needed — the entry modal, charts, and history list derive from it.
export const BODY_METRICS = [
  { id: 'weight', label: 'Weight', unit: 'kg', step: 0.1 },
  { id: 'bodyFat', label: 'Body fat', unit: '%', step: 0.1 },
  { id: 'restingHr', label: 'Resting HR', unit: 'bpm', step: 1 },
  { id: 'waist', label: 'Waist', unit: 'cm', step: 0.5 },
];
