// The only data API the UI touches. Cache-first reads, write-through saves
// with sha-checked PUTs, an offline dirty queue, and background refresh.
//
// Write ownership (the reason browser/Actions conflicts can't happen):
//   - browser owns everything in DATA_FILES (incl. matches.json)
//   - the Actions workflow owns data/strava/** — read-only here
// The merge path below only ever handles browser-vs-browser (second device
// or tab) conflicts, merged per record id with local dirty records winning.
// Note: a record deleted locally can resurrect from such a merge; accepted
// for a single-user tool.

import * as cache from './cache.js';
import { makeClient, hasToken, ConflictError, NotFoundError, AuthError } from './github-api.js';
import { encryptJson, decryptJson, isEnvelope } from '../crypto.js';
import { migratePlan, migrateExercise } from '../models.js';
import { DATA_FILES, STRAVA_DIR, DATA_REPO_DEFAULT } from '../config.js';

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

const client = makeClient(getDataRepo);
const listeners = new Set();
let status = 'local'; // 'local' | 'ok' | 'pending' | 'error'
let lastError = null;

// ---------- encryption (optional password) ----------
// When a password is set, these repo files are written as AES-GCM envelopes
// (see crypto.js): logs, body metrics, and all Strava GPS shards. Plans,
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
    || path.startsWith(`${STRAVA_DIR}/activities-`);
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

// ---------- reads ----------

export function get(collection) {
  const data = cache.getData(DATA_FILES[collection]) ?? [];
  // Records written by the app's first version are upgraded transparently;
  // the migrated shape is persisted whenever the user next saves.
  if (collection === 'plans') return data.map(migratePlan);
  if (collection === 'exercises') return data.map(migrateExercise);
  return data;
}

// All Strava entries across cached month shards, newest first.
export function getStravaEntries() {
  const shardPaths = cache.getData('ft.strava.index') ?? [];
  const all = [];
  for (const p of shardPaths) {
    const shard = cache.getData(p);
    if (Array.isArray(shard)) all.push(...shard);
  }
  all.sort((a, b) => (a.date < b.date ? 1 : -1));
  return all;
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
    await refreshStrava();
    if (!cache.getQueue().length) setStatus('ok');
  } catch (e) {
    if (e instanceof AuthError) setStatus('error', e);
    // other failures: keep whatever we had cached
  }
}

export async function refreshStrava() {
  const entries = await client.listDir(STRAVA_DIR);
  const shards = entries.filter((e) => /^activities-\d{4}-\d{2}\.json$/.test(e.name));
  const index = [];
  let changed = false;
  for (const s of shards) {
    index.push(s.path);
    if (s.sha !== cache.getSha(s.path)) {
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
  cache.setData('ft.strava.index', index);
  if (changed) emit({ type: 'changed', collection: 'strava' });
  return changed;
}

// Re-upload cached collections to the data repo. `collections` defaults to
// the encryptable ones, which is what enabling/disabling a password needs;
// pass all of DATA_FILES to seed a freshly-created repo from this browser.
// Strava shards are normally Actions-owned; these migration writes are the
// documented exception (the sync script's id-dedupe makes races benign).
export async function rewriteEncryptedFiles(collections = ['logs', 'metrics', 'goals']) {
  if (!canSync()) return; // local mode, or no repo configured yet
  for (const collection of collections) {
    const path = DATA_FILES[collection];
    cache.markDirty(path);
    await push(path, collection);
  }
  const shardPaths = cache.getData('ft.strava.index') ?? [];
  for (const path of shardPaths) {
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
  for (const path of cache.getData('ft.strava.index') ?? []) cache.setSha(path, null);
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
