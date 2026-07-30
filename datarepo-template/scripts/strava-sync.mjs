#!/usr/bin/env node
// Strava → repo sync. Run by .github/workflows/strava-sync.yml on a schedule
// (and via workflow_dispatch). Zero npm dependencies — Node 18+ global fetch.
//
// Env: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN
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

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN, ENCRYPTION_PASSWORD } = process.env;
if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
  console.error('Missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN');
  process.exit(1);
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
  for (let page = 1; page <= 20; page++) {
    const url = new URL('https://www.strava.com/api/v3/athlete/activities');
    url.searchParams.set('after', String(afterEpoch));
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Activities fetch failed: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
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
const after = Math.max(0, (state.lastSyncEpoch || 0) - OVERLAP_SEC);

console.log(`Fetching activities after ${new Date(after * 1000).toISOString()}`);
const token = await getAccessToken();
const activities = await fetchActivities(token, after);
console.log(`Fetched ${activities.length} activities`);

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

const maxEpoch = activities.reduce(
  (m, a) => Math.max(m, Math.floor(new Date(a.start_date).getTime() / 1000)),
  state.lastSyncEpoch || 0,
);
await writeFile(STATE_PATH, JSON.stringify({ lastSyncEpoch: maxEpoch, lastRunISO: new Date().toISOString() }, null, 2) + '\n');
console.log(`Done: ${added} new activities; lastSyncEpoch=${maxEpoch}`);
