// The only data API the UI touches. Cache-first reads, write-through saves
// with sha-checked PUTs, an offline dirty queue, and background refresh.
//
// Write ownership (the reason browser/Actions conflicts can't happen):
//   - browser owns everything in DATA_FILES (incl. matches.json)
//   - the Polar sync workflow owns data/activities/** — read-only here
//   - the browser owns data/imported/** (file imports)
// The merge path below only ever handles browser-vs-browser (second device
// or tab) conflicts, merged per record id with local dirty records winning.
// Note: a record deleted locally can resurrect from such a merge; accepted
// for a single-user tool.

import * as cache from './cache.js';
import { makeClient, hasToken, ConflictError, NotFoundError, AuthError } from './github-api.js';
import { encryptJson, decryptJson, isEnvelope } from '../crypto.js';
import { migratePlan, migrateExercise } from '../models.js';
import { DATA_FILES, ACTIVITY_DIR, IMPORT_DIR, LEGACY_STRAVA_DIR, DATA_REPO_DEFAULT } from '../config.js';

// ---------- data repository ----------
// Personal data lives in a separate PRIVATE repo, never the public one that
// serves the app. It's configured at runtime so switching repos needs no
// redeploy; the client reads this getter on every call, so a change in
// Settings takes effect immediately.

const REPO_KEY = 'ft.datarepo';

export function getDataRepo() {
  try {
    const stored = JSON.parse(localStorage.getItem(REPO_KEY));
    if (stored?.owner && stored?.repo) return { branch: 'main', ...stored };
  } catch {
    // fall through to the default
  }
  return DATA_REPO_DEFAULT;
}

export function setDataRepo(cfg) {
  if (cfg?.owner && cfg?.repo) {
    localStorage.setItem(REPO_KEY, JSON.stringify({
      owner: cfg.owner.trim(),
      repo: cfg.repo.trim(),
      branch: (cfg.branch || 'main').trim(),
    }));
  } else {
    localStorage.removeItem(REPO_KEY);
  }
}

export function hasDataRepo() {
  const c = getDataRepo();
  return !!(c?.owner && c?.repo);
}

// Remote sync needs both a token and a destination.
function canSync() {
  return hasToken() && hasDataRepo();
}

// Cached list of every activity shard path we know about, across all dirs.
const ACTIVITY_INDEX = 'ft.activity.index';

const client = makeClient(getDataRepo);
const listeners = new Set();
let status = 'local'; // 'local' | 'ok' | 'pending' | 'error'
let lastError = null;

// ---------- encryption (optional password) ----------
// When a password is set, these repo files are written as AES-GCM envelopes
// (see crypto.js): logs, body metrics, goals, and all activity shards. Plans,
// exercises, and match links stay plaintext. The local cache is always
// plaintext — the device is trusted (same model as the PAT).

const PW_KEY = 'ft.enc.pw';
const lockedPaths = new Set(); // envelopes we couldn't decrypt (no/wrong password)

function password() {
  return localStorage.getItem(PW_KEY) || '';
}

export function setPassword(pw) {
  if (pw) localStorage.setItem(PW_KEY, pw);
  else localStorage.removeItem(PW_KEY);
}

export function encryption() {
  return { enabled: !!password(), locked: lockedPaths.size > 0 };
}

function isEncryptedPath(path) {
  return path === DATA_FILES.logs || path === DATA_FILES.metrics || path === DATA_FILES.goals
    || path.startsWith(`${ACTIVITY_DIR}/activities-`)
    || path.startsWith(`${IMPORT_DIR}/imported-`)
    || path.startsWith(`${LEGACY_STRAVA_DIR}/activities-`);
}

// Repo-file (de)serialization boundary — the ONLY place ciphertext exists.
export async function serializeFile(path, data) {
  const body = password() && isEncryptedPath(path) ? await encryptJson(data, password()) : data;
  return JSON.stringify(body, null, 2) + '\n';
}

// -> { data } on success, { locked: true } when an envelope can't be opened.
export async function deserializeFile(path, parsed) {
  if (!isEnvelope(parsed)) {
    lockedPaths.delete(path);
    return { data: parsed };
  }
  if (password()) {
    try {
      const data = await decryptJson(parsed, password());
      lockedPaths.delete(path);
      return { data };
    } catch {
      // fall through to locked
    }
  }
  lockedPaths.add(path);
  return { locked: true };
}

function emit(event) {
  for (const fn of listeners) fn(event);
}

function setStatus(s, err = null) {
  status = s;
  lastError = err;
  emit({ type: 'sync-status', status: s, error: err });
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function syncStatus() {
  return { status, error: lastError, connected: canSync() };
}

// Recompute the badge state from current settings. Called after the token or
// data repo changes so the header reflects it immediately, rather than staying
// stale until the next sync happens to run.
export function refreshStatus() {
  setStatus(canSync() ? (cache.getQueue().length ? 'pending' : 'ok') : 'local');
}

// ---------- reads ----------

export function get(collection) {
  const data = cache.getData(DATA_FILES[collection]) ?? [];
  // Records written by the app's first version are upgraded transparently;
  // the migrated shape is persisted whenever the user next saves.
  if (collection === 'plans') return data.map(migratePlan);
  if (collection === 'exercises') return data.map(migrateExercise);
  return data;
}

// Every synced activity across cached month shards, newest first. Merges the
// Actions-written directory, browser-written imports, and legacy Strava
// shards. Deduped by id in case the same activity arrived twice (e.g. synced
// and then also imported from a file).
export function getActivityEntries() {
  const byId = new Map();
  for (const p of cache.getData(ACTIVITY_INDEX) ?? []) {
    const shard = cache.getData(p);
    if (Array.isArray(shard)) for (const e of shard) byId.set(e.id, e);
  }
  return [...byId.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---------- writes ----------

export async function save(collection, records) {
  const path = DATA_FILES[collection];
  cache.setData(path, records);
  cache.markDirty(path);
  emit({ type: 'changed', collection });
  await push(path, collection);
}

export async function upsert(collection, record) {
  const records = get(collection).slice();
  const i = records.findIndex((r) => r.id === record.id);
  if (i >= 0) records[i] = record;
  else records.push(record);
  await save(collection, records);
}

export async function remove(collection, id) {
  await save(collection, get(collection).filter((r) => r.id !== id));
}

async function push(path, collection) {
  if (!canSync() || !navigator.onLine) {
    setStatus(canSync() ? 'pending' : 'local');
    return;
  }
  setStatus('pending');
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const content = await serializeFile(path, cache.getData(path));
      try {
        const sha = await client.putFile(path, content, cache.getSha(path), `Update ${path}`);
        cache.setSha(path, sha);
        cache.clearDirty(path);
        setStatus(cache.getQueue().length ? 'pending' : 'ok');
        return;
      } catch (e) {
        if (!(e instanceof ConflictError)) throw e;
        await mergeRemote(path, collection);
      }
    }
    throw new Error(`Gave up pushing ${path} after repeated conflicts`);
  } catch (e) {
    if (e instanceof AuthError) setStatus('error', e);
    else setStatus('pending', e); // network or transient: stays queued
  }
}

async function mergeRemote(path, collection) {
  let remote = [];
  let sha = null;
  try {
    const f = await client.getFile(path);
    const res = await deserializeFile(path, JSON.parse(f.content));
    // Locked remote = encrypted under a password we don't have; merging is
    // impossible and overwriting would destroy data. Stay dirty and queued.
    if (res.locked) throw new Error(`Cannot merge ${path}: encrypted with an unknown password`);
    remote = res.data;
    sha = f.sha;
  } catch (e) {
    if (!(e instanceof NotFoundError)) throw e;
  }
  const local = cache.getData(path) ?? [];
  const byId = new Map();
  for (const r of remote) byId.set(r.id, r);
  for (const r of local) byId.set(r.id, r); // local dirty records win
  cache.setData(path, [...byId.values()]);
  cache.setSha(path, sha);
  if (collection) emit({ type: 'changed', collection });
}

// Retry everything still dirty (called on 'online' and on a timer).
export async function flushQueue() {
  for (const path of cache.getQueue()) {
    const collection = Object.keys(DATA_FILES).find((k) => DATA_FILES[k] === path);
    await push(path, collection);
  }
}

// ---------- background refresh ----------

export async function refresh() {
  if (!canSync() || !navigator.onLine) return;
  try {
    for (const [collection, path] of Object.entries(DATA_FILES)) {
      if (cache.isDirty(path)) continue; // don't clobber unpushed local edits
      try {
        const { content, sha } = await client.getFile(path);
        if (sha !== cache.getSha(path)) {
          const res = await deserializeFile(path, JSON.parse(content));
          if (res.locked) {
            // Keep the old cache and old sha so we retry once unlocked.
            emit({ type: 'sync-status', status, error: lastError });
            continue;
          }
          cache.setData(path, res.data);
          cache.setSha(path, sha);
          emit({ type: 'changed', collection });
        }
      } catch (e) {
        if (!(e instanceof NotFoundError)) throw e; // absent file = empty collection
      }
    }
    await refreshActivities();
    if (!cache.getQueue().length) setStatus('ok');
  } catch (e) {
    if (e instanceof AuthError) setStatus('error', e);
    // other failures: keep whatever we had cached
  }
}

// Pull month shards from all three activity directories. Locally-dirty
// imports are skipped so an unpushed import isn't clobbered by the remote.
export async function refreshActivities() {
  const dirs = [
    { dir: ACTIVITY_DIR, prefix: 'activities-' },
    { dir: IMPORT_DIR, prefix: 'imported-' },
    { dir: LEGACY_STRAVA_DIR, prefix: 'activities-' },
  ];
  const index = [];
  let changed = false;
  for (const { dir, prefix } of dirs) {
    const entries = await client.listDir(dir);
    const re = new RegExp(`^${prefix}\\d{4}-\\d{2}\\.json$`);
    for (const s of entries.filter((e) => re.test(e.name))) {
      index.push(s.path);
      if (cache.isDirty(s.path) || s.sha === cache.getSha(s.path)) continue;
      const { content, sha } = await client.getFile(s.path);
      const res = await deserializeFile(s.path, JSON.parse(content));
      if (res.locked) {
        emit({ type: 'sync-status', status, error: lastError });
        continue;
      }
      cache.setData(s.path, res.data);
      cache.setSha(s.path, sha);
      changed = true;
    }
  }
  // Keep any locally-created import shards that aren't on the remote yet.
  for (const p of cache.getData(ACTIVITY_INDEX) ?? []) {
    if (!index.includes(p) && cache.isDirty(p)) index.push(p);
  }
  cache.setData(ACTIVITY_INDEX, index);
  if (changed) emit({ type: 'changed', collection: 'activities' });
  return changed;
}

// Add imported activities to the browser-owned import shards, keyed by local
// month and deduped by id. Returns how many were new.
export async function addImportedActivities(entries) {
  const byMonth = new Map();
  for (const e of entries) {
    const path = `${IMPORT_DIR}/imported-${e.date.slice(0, 7)}.json`;
    if (!byMonth.has(path)) byMonth.set(path, []);
    byMonth.get(path).push(e);
  }
  let added = 0;
  const index = (cache.getData(ACTIVITY_INDEX) ?? []).slice();
  for (const [path, incoming] of byMonth) {
    const existing = cache.getData(path) ?? [];
    const byId = new Map(existing.map((e) => [e.id, e]));
    for (const e of incoming) {
      if (!byId.has(e.id)) added++;
      byId.set(e.id, e);
    }
    cache.setData(path, [...byId.values()].sort((a, b) => (a.date < b.date ? -1 : 1)));
    cache.markDirty(path);
    if (!index.includes(path)) index.push(path);
    await push(path, null);
  }
  cache.setData(ACTIVITY_INDEX, index);
  emit({ type: 'changed', collection: 'activities' });
  return added;
}

// Re-upload cached collections to the data repo. `collections` defaults to
// the encryptable ones, which is what enabling/disabling a password needs;
// pass all of DATA_FILES to seed a freshly-created repo from this browser.
// Activity shards are normally Actions-owned; these migration writes are the
// documented exception (the sync script's id-dedupe makes races benign).
export async function rewriteEncryptedFiles(collections = ['logs', 'metrics', 'goals']) {
  if (!canSync()) return; // local mode, or no repo configured yet
  for (const collection of collections) {
    const path = DATA_FILES[collection];
    cache.markDirty(path);
    await push(path, collection);
  }
  for (const path of cache.getData(ACTIVITY_INDEX) ?? []) {
    const data = cache.getData(path);
    if (!Array.isArray(data)) continue; // never had it decrypted — skip
    const content = await serializeFile(path, data);
    try {
      const sha = await client.putFile(path, content, cache.getSha(path), `Update ${path}`);
      cache.setSha(path, sha);
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
      // Sync workflow wrote meanwhile; next refresh + sync run reconverge.
    }
  }
}

// Seed a newly configured data repo with everything this browser holds.
// Shas are cleared first so each file is created rather than sha-checked
// against a different repo's history.
export async function pushAllData() {
  if (!canSync()) throw new Error('Set a data repository and a token first');
  for (const path of Object.values(DATA_FILES)) cache.setSha(path, null);
  for (const path of cache.getData(ACTIVITY_INDEX) ?? []) cache.setSha(path, null);
  await rewriteEncryptedFiles(Object.keys(DATA_FILES));
}

// ---------- lifecycle ----------

export function init() {
  window.addEventListener('online', () => flushQueue());
  // Cross-tab: another tab wrote localStorage — re-render rather than merge later.
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('ft.data.')) emit({ type: 'changed', collection: 'external' });
  });
  setInterval(() => {
    if (cache.getQueue().length) flushQueue();
  }, 30000);
  setStatus(canSync() ? (cache.getQueue().length ? 'pending' : 'ok') : 'local');
  refresh(); // fire-and-forget background load
}

export { client, hasToken };
