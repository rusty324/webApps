// Thin GitHub Contents API client. Auth is a fine-grained PAT scoped to the
// single private data repo, kept in localStorage and never rendered back
// into the DOM. The repo it targets is configured at runtime — see
// store.js getDataRepo() and README → "Where your data lives".

const API = 'https://api.github.com';
const PAT_KEY = 'ft.pat';

export class NotConfiguredError extends Error {
  constructor() {
    super('No data repository configured — set one in Settings');
    this.name = 'NotConfiguredError';
  }
}

export class ConflictError extends Error {
  constructor(path) {
    super(`Conflict writing ${path}`);
    this.name = 'ConflictError';
    this.path = path;
  }
}
export class AuthError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'AuthError';
  }
}
export class NotFoundError extends Error {
  constructor(path) {
    super(`Not found: ${path}`);
    this.name = 'NotFoundError';
    this.path = path;
  }
}

export function getToken() {
  return localStorage.getItem(PAT_KEY) || '';
}
export function setToken(t) {
  if (t) localStorage.setItem(PAT_KEY, t.trim());
  else localStorage.removeItem(PAT_KEY);
}
export function hasToken() {
  return !!getToken();
}

function headers() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function check(res, path) {
  if (res.ok) return res;
  if (res.status === 401 || res.status === 403) throw new AuthError(`GitHub auth failed (${res.status})`);
  if (res.status === 404) throw new NotFoundError(path);
  if (res.status === 409 || res.status === 422) throw new ConflictError(path);
  throw new Error(`GitHub API ${res.status} for ${path}`);
}

// UTF-8-safe base64 helpers (btoa alone breaks on non-ASCII notes).
function b64encode(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)));
}
function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// repoCfgOrGetter: either a {owner, repo, branch} object or a function
// returning one. The getter form lets Settings retarget the data repo
// without a reload, since every call re-reads the current config.
export function makeClient(repoCfgOrGetter) {
  const cfg = () => {
    const c = typeof repoCfgOrGetter === 'function' ? repoCfgOrGetter() : repoCfgOrGetter;
    if (!c?.owner || !c?.repo) throw new NotConfiguredError();
    return { branch: 'main', ...c };
  };
  const base = () => `${API}/repos/${cfg().owner}/${cfg().repo}/contents`;

  return {
    isConfigured() {
      try {
        cfg();
        return true;
      } catch {
        return false;
      }
    },
    target() {
      const c = typeof repoCfgOrGetter === 'function' ? repoCfgOrGetter() : repoCfgOrGetter;
      return c?.owner && c?.repo ? { branch: 'main', ...c } : null;
    },
    // -> { content: string, sha } ; throws NotFoundError if absent
    async getFile(path) {
      const res = await fetch(`${base()}/${path}?ref=${cfg().branch}`, { headers: headers() });
      await check(res, path);
      const json = await res.json();
      return { content: b64decode(json.content), sha: json.sha };
    },

    // sha: pass null on create. -> new sha. Throws ConflictError on sha mismatch.
    async putFile(path, content, sha, message) {
      const body = {
        message,
        content: b64encode(content),
        branch: cfg().branch,
      };
      if (sha) body.sha = sha;
      const res = await fetch(`${base()}/${path}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await check(res, path);
      const json = await res.json();
      return json.content.sha;
    },

    // -> [{ name, path, sha }] ; [] if the directory doesn't exist yet
    async listDir(path) {
      const res = await fetch(`${base()}/${path}?ref=${cfg().branch}`, { headers: headers() });
      if (res.status === 404) return [];
      await check(res, path);
      const json = await res.json();
      return Array.isArray(json) ? json.map(({ name, path: p, sha }) => ({ name, path: p, sha })) : [];
    },

    // Fire the activity sync workflow via workflow_dispatch (PAT needs Actions:write).
    async dispatchWorkflow(workflowFile) {
      const res = await fetch(
        `${API}/repos/${cfg().owner}/${cfg().repo}/actions/workflows/${workflowFile}/dispatches`,
        {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: cfg().branch }),
        },
      );
      await check(res, workflowFile);
    },

    // Cheap validity probe for the settings panel.
    async validate() {
      const res = await fetch(`${API}/repos/${cfg().owner}/${cfg().repo}`, { headers: headers() });
      await check(res, 'repo');
      return true;
    },
  };
}
