#!/usr/bin/env node
// Strava → repo sync. Run by .github/workflows/strava-sync.yml on a schedule
// (and via workflow_dispatch). Zero npm dependencies — Node 18+ global fetch.
//
// Secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN,
//          ENCRYPTION_PASSWORD (only if the app's encryption is on)
// Variables (all optional — see README):
//   STRAVA_SYNC_AFTER   YYYY-MM-DD floor; nothing older is ever fetched.
//                       Unset means the FIRST run records today as the
//                       baseline, so setup doesn't pull years of history.
//   STRAVA_SYNC_TYPES   Comma-separated sport_type allowlist, e.g.
//                       "Run,TrailRun,Ride". Unset keeps every type.
//   STRAVA_MAX_PAGES    Page cap, 100 activities per page (default 20).
//
// Writes: data/strava/activities-YYYY-MM.json (one shard per month, keyed by
//         the activity's LOCAL date) and data/strava/state.json.
// The browser never writes these files, so there is exactly one writer.
//
// Re-runs are no-ops: we re-fetch a 7-day overlap window (late watch uploads)
// and dedupe by Strava activity id before writing.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { encryptJson, decryptJson, isEnvelope, DecryptError } from './crypto.js';

const STRAVA_DIR = join(process.cwd(), 'data', 'strava');
const STATE_PATH = join(STRAVA_DIR, 'state.json');
const OVERLAP_SEC = 7 * 86400;
const PER_PAGE = 100;

const {
  STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN, ENCRYPTION_PASSWORD,
  STRAVA_SYNC_AFTER, STRAVA_SYNC_TYPES, STRAVA_MAX_PAGES,
} = process.env;
if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
  console.error('Missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN');
  process.exit(1);
}

const maxPages = Math.max(1, parseInt(STRAVA_MAX_PAGES ?? '20', 10) || 20);
const typeFilter = (STRAVA_SYNC_TYPES ?? '')
  .split(',')
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

function parseFloorDate(s) {
  const epoch = Math.floor(Date.parse(`${s}T00:00:00Z`) / 1000);
  if (Number.isNaN(epoch)) {
    console.error(`STRAVA_SYNC_AFTER is not a valid YYYY-MM-DD date: "${s}"`);
    process.exit(1);
  }
  return epoch;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

// Shards may be encrypted (the app's optional password). Never write a
// plaintext shard next to encrypted ones — fail loudly instead.
async function readShard(path) {
  const parsed = await readJson(path, []);
  if (!isEnvelope(parsed)) return parsed;
  if (!ENCRYPTION_PASSWORD) {
    console.error(`${path} is encrypted but the ENCRYPTION_PASSWORD secret is not set.`);
    console.error('Add the same password used in the app as a repo Actions secret named ENCRYPTION_PASSWORD.');
    process.exit(1);
  }
  try {
    return await decryptJson(parsed, ENCRYPTION_PASSWORD);
  } catch (e) {
    if (e instanceof DecryptError) {
      console.error(`${path}: ENCRYPTION_PASSWORD does not match the password the file was encrypted with.`);
      process.exit(1);
    }
    throw e;
  }
}

async function writeShard(path, entries) {
  const body = ENCRYPTION_PASSWORD ? await encryptJson(entries, ENCRYPTION_PASSWORD) : entries;
  await writeFile(path, JSON.stringify(body, null, 2) + '\n');
}

async function getAccessToken() {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: STRAVA_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

async function fetchActivities(token, afterEpoch) {
  const all = [];
  let hitCap = true;
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL('https://www.strava.com/api/v3/athlete/activities');
    url.searchParams.set('after', String(afterEpoch));
    url.searchParams.set('per_page', String(PER_PAGE));
    url.searchParams.set('page', String(page));
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Activities fetch failed: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < PER_PAGE) {
      hitCap = false;
      break;
    }
  }
  // Never truncate silently: if every page came back full we stopped early.
  if (hitCap) {
    console.warn(`WARNING: hit the ${maxPages}-page cap at ${all.length} activities. `
      + 'More history may remain — run again to continue, or raise STRAVA_MAX_PAGES.');
  }
  return all;
}

// Map a Strava activity to the app's LogEntry-ish shape. Dates use
// start_date_local so "today's run" matches the athlete's calendar day.
function mapActivity(a) {
  const entry = {
    id: `strava-${a.id}`,
    stravaId: a.id,
    date: a.start_date_local.slice(0, 10),
    name: a.name ?? '',
    type: a.sport_type || a.type || 'Workout',
    distanceM: a.distance ? Math.round(a.distance) : null,
    movingSec: a.moving_time ?? null,
    elapsedSec: a.elapsed_time ?? null,
    avgHr: a.average_heartrate ?? null,
    elevationM: a.total_elevation_gain ?? null,
    source: 'strava',
  };
  if (a.map?.summary_polyline) entry.gpsPolyline = a.map.summary_polyline;
  return entry;
  // Note: no matchStatus here — match state is a browser-owned overlay
  // (data/matches.json), so this file stays single-writer.
}

const state = await readJson(STATE_PATH, { lastSyncEpoch: 0 });
const now = Math.floor(Date.now() / 1000);

// The floor bounds how far back we ever look. An explicit variable always
// wins. Otherwise the FIRST run records "now" and persists it as
// syncFloorEpoch — persisting matters: recomputing "now" every run would
// slide the floor forward and nothing would ever sync again.
const explicitFloor = STRAVA_SYNC_AFTER ? parseFloorDate(STRAVA_SYNC_AFTER) : null;
const floor = explicitFloor ?? state.syncFloorEpoch ?? now;
const isFirstRun = state.syncFloorEpoch == null && !state.lastSyncEpoch;
if (isFirstRun && explicitFloor == null) {
  console.log(`First run — baseline set to ${new Date(floor * 1000).toISOString().slice(0, 10)}. `
    + 'Only activities after this will sync; set the STRAVA_SYNC_AFTER variable to backfill history.');
}

// Normally resume from the last sync (minus the overlap), clamped so it can
// never reach behind the floor. But if the floor was deliberately moved
// EARLIER than the one we recorded, that's a backfill request — honour it,
// otherwise lastSyncEpoch would keep us pinned to recent history forever.
const storedFloor = state.syncFloorEpoch ?? null;
const backfilling = explicitFloor != null && storedFloor != null && explicitFloor < storedFloor;
const resume = state.lastSyncEpoch ? state.lastSyncEpoch - OVERLAP_SEC : floor;
const after = backfilling ? explicitFloor : Math.max(floor, resume);
if (backfilling) {
  console.log(`STRAVA_SYNC_AFTER moved earlier — backfilling from ${new Date(after * 1000).toISOString().slice(0, 10)}.`);
}

console.log(`Fetching activities after ${new Date(after * 1000).toISOString()}`);
const token = await getAccessToken();
const fetched = await fetchActivities(token, after);

// Strava can't filter by type server-side, so drop unwanted ones here.
const activities = typeFilter.length
  ? fetched.filter((a) => typeFilter.includes(String(a.sport_type || a.type || '').toLowerCase()))
  : fetched;
console.log(`Fetched ${fetched.length} activities`
  + (typeFilter.length ? `; kept ${activities.length} matching ${typeFilter.join(', ')}` : ''));

await mkdir(STRAVA_DIR, { recursive: true });

// Group by local month and merge into existing shards, deduping by id.
const byMonth = new Map();
for (const a of activities) {
  const entry = mapActivity(a);
  const month = entry.date.slice(0, 7);
  if (!byMonth.has(month)) byMonth.set(month, []);
  byMonth.get(month).push(entry);
}

let added = 0;
for (const [month, entries] of byMonth) {
  const shardPath = join(STRAVA_DIR, `activities-${month}.json`);
  const existing = await readShard(shardPath);
  const byId = new Map(existing.map((e) => [e.stravaId, e]));
  for (const e of entries) {
    if (!byId.has(e.stravaId)) added++;
    byId.set(e.stravaId, e); // refresh existing too (name edits, late HR data)
  }
  const merged = [...byId.values()].sort((x, y) => (x.date < y.date ? -1 : 1));
  await writeShard(shardPath, merged);
  console.log(`Wrote ${shardPath} (${merged.length} entries)`);
}

// Advance past everything we FETCHED, not just what survived the type
// filter — otherwise excluded activities would be re-fetched every run.
const maxEpoch = fetched.reduce(
  (m, a) => Math.max(m, Math.floor(new Date(a.start_date).getTime() / 1000)),
  state.lastSyncEpoch || 0,
);
await writeFile(STATE_PATH, JSON.stringify({
  lastSyncEpoch: maxEpoch,
  syncFloorEpoch: floor, // persisted so the default baseline can't slide
  lastRunISO: new Date().toISOString(),
}, null, 2) + '\n');
console.log(`Done: ${added} new activities; lastSyncEpoch=${maxEpoch}`);
