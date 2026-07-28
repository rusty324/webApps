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
import { DATA_FILES, STRAVA_DIR, REPO } from '../config.js';

const client = makeClient(REPO);
const listeners = new Set();
let status = 'local'; // 'local' | 'ok' | 'pending' | 'error'
let lastError = null;

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
  return { status, error: lastError, connected: hasToken() };
}

// ---------- reads ----------

export function get(collection) {
  return cache.getData(DATA_FILES[collection]) ?? [];
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
  if (!hasToken() || !navigator.onLine) {
    setStatus(hasToken() ? 'pending' : 'local');
    return;
  }
  setStatus('pending');
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const content = JSON.stringify(cache.getData(path), null, 2) + '\n';
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
    remote = JSON.parse(f.content);
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
  if (!hasToken() || !navigator.onLine) return;
  try {
    for (const [collection, path] of Object.entries(DATA_FILES)) {
      if (cache.isDirty(path)) continue; // don't clobber unpushed local edits
      try {
        const { content, sha } = await client.getFile(path);
        if (sha !== cache.getSha(path)) {
          cache.setData(path, JSON.parse(content));
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
      cache.setData(s.path, JSON.parse(content));
      cache.setSha(s.path, sha);
      changed = true;
    }
  }
  cache.setData('ft.strava.index', index);
  if (changed) emit({ type: 'changed', collection: 'strava' });
  return changed;
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
  setStatus(hasToken() ? (cache.getQueue().length ? 'pending' : 'ok') : 'local');
  refresh(); // fire-and-forget background load
}

export { client, hasToken };
