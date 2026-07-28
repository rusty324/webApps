// Write-through localStorage cache. Keys:
//   ft.data.<path>  JSON string of the file content
//   ft.sha.<path>   last known remote blob sha
//   ft.queue        JSON array of dirty paths awaiting push

const DATA = 'ft.data.';
const SHA = 'ft.sha.';
const QUEUE = 'ft.queue';

export function getData(path) {
  const raw = localStorage.getItem(DATA + path);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setData(path, value) {
  localStorage.setItem(DATA + path, JSON.stringify(value));
}

export function getSha(path) {
  return localStorage.getItem(SHA + path);
}

export function setSha(path, sha) {
  if (sha) localStorage.setItem(SHA + path, sha);
  else localStorage.removeItem(SHA + path);
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE)) ?? [];
  } catch {
    return [];
  }
}

export function markDirty(path) {
  const q = getQueue();
  if (!q.includes(path)) {
    q.push(path);
    localStorage.setItem(QUEUE, JSON.stringify(q));
  }
}

export function clearDirty(path) {
  const q = getQueue().filter((p) => p !== path);
  localStorage.setItem(QUEUE, JSON.stringify(q));
}

export function isDirty(path) {
  return getQueue().includes(path);
}
