// Regression suite for "stuck on pending sync". Versions before this fix
// committed a literal `null` for any collection that had never been written
// (seeding a repo, or enabling encryption), and the next conflicting push then
// threw iterating it — which was reported as 'pending' and retried forever.
// Every scenario here is one a real browser or data repo can already be in.
import { BASE, chromium, reporter, stubGithub } from './lib.mjs';

const { step, done } = reporter();
const browser = await (await chromium()).launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const gh = await stubGithub(page);

const NOTES = 'https://api.github.com/**/contents/data/notes.json**';
const badge = () => page.textContent('#badge');
const title = () => page.getAttribute('#badge', 'title');
const queue = () => page.evaluate(() => JSON.parse(localStorage.getItem('notes.queue') ?? '[]'));
const cached = () => page.evaluate(() => localStorage.getItem('notes.data.data/notes.json'));
const waitBadge = (text) => page.waitForFunction((t) => document.getElementById('badge').textContent === t, text);
const remoteFile = (body, sha) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ content: Buffer.from(body).toString('base64'), sha }),
});
const addNote = async (text) => {
  await page.fill('#new-note', text);
  await page.click('#add-note');
  await page.waitForSelector(`.row-title:has-text("${text}")`);
};

await page.goto(`${BASE}/ghsync/example/`);
await page.evaluate(() => {
  localStorage.setItem('notes.datarepo', JSON.stringify({ owner: 'me', repo: 'data', branch: 'main' }));
  localStorage.setItem('notes.pat', 'github_pat_fake');
});
await page.reload();
await waitBadge('synced');

// ---- 1. seeding never writes `null` ----
gh.reset();
await page.click('#settings-btn');
await page.evaluate(() => { document.querySelector('.settings-section[data-section="datarepo"]').open = true; });
await page.click('button:has-text("Upload all local data")');
await page.waitForSelector('.toast:has-text("Uploaded all local data")');
step('seeding skips a collection that was never written', gh.puts().length === 0,
  gh.puts().map((c) => gh.putBody(c.url.split('/contents/')[1])).join(' | '));
step('and leaves nothing queued', (await queue()).length === 0);

// ---- 2. a browser an older version left wedged recovers on load ----
await page.evaluate(() => {
  localStorage.removeItem('notes.data.data/notes.json');
  localStorage.setItem('notes.queue', JSON.stringify(['data/notes.json']));
});
gh.reset();
await page.reload();
await waitBadge('synced');
step('a queued path with no data is dropped, not pushed as null', gh.puts().length === 0);
step('the queue is empty after load, without waiting for the retry timer', (await queue()).length === 0);

// ---- 3. a data repo that already holds `null` reads as empty ----
await page.route(NOTES, (route) => (route.request().method() === 'GET'
  ? route.fulfill(remoteFile('null\n', 'null-sha'))
  : route.fallback()));
await page.evaluate(() => localStorage.removeItem('notes.sha.data/notes.json'));
await page.reload();
await waitBadge('synced');
step('a remote null is cached as an empty array', (await cached()) === '[]', String(await cached()));
step('and the app renders it as no notes', (await page.locator('.muted:has-text("No notes yet")').count()) === 1);
await page.unroute(NOTES);

// ---- 4. the exact wedge: remote null + a conflicting push ----
let conflicts = 0;
await page.route(NOTES, (route) => {
  const req = route.request();
  if (req.method() === 'PUT' && conflicts === 0) {
    conflicts++;
    return route.fulfill({ status: 409, contentType: 'application/json', body: '{"message":"sha mismatch"}' });
  }
  if (req.method() === 'GET') return route.fulfill(remoteFile('null\n', 'null-sha-2'));
  return route.fallback();
});
gh.reset();
await addNote('after the null seed');
await waitBadge('synced');
step('a conflict against a remote null merges instead of wedging', conflicts === 1 && (await queue()).length === 0);
const merged = JSON.parse(gh.putBody('notes.json') || 'null');
step('the retried push is an array holding the local note',
  Array.isArray(merged) && merged.some((n) => n.text === 'after the null seed'), JSON.stringify(merged));
await page.unroute(NOTES);

// ---- 5. permanent failures say so instead of hiding under "pending" ----
await page.route(NOTES, (route) => (route.request().method() === 'PUT'
  ? route.fulfill({ status: 400, contentType: 'application/json', body: '{"message":"bad"}' })
  : route.fallback()));
await addNote('rejected by github');
await waitBadge('sync error');
step('a 400 shows sync error, not pending', (await badge()) === 'sync error');
step('the badge tooltip names the failure', /400/.test(await title()), await title());
step('the write stays queued for retry', (await queue()).includes('data/notes.json'));
await page.unroute(NOTES);
await page.evaluate(() => window.dispatchEvent(new Event('online')));
await waitBadge('synced');
step('it recovers once GitHub accepts the write', (await queue()).length === 0);

// ---- 6. but real network trouble is still just "pending" ----
await page.route(NOTES, (route) => (route.request().method() === 'PUT' ? route.abort('internetdisconnected') : route.fallback()));
await addNote('written on a train');
await waitBadge('pending sync');
step('a dropped connection is pending, not an error', (await badge()) === 'pending sync');
step('and the tooltip says it was the network', /Network error/.test(await title()), await title());
await page.unroute(NOTES);
await page.evaluate(() => window.dispatchEvent(new Event('online')));
await waitBadge('synced');

// ---- 7. a file of the wrong shape is never overwritten by a merge ----
let wrongShapePuts = 0;
await page.route(NOTES, (route) => {
  const req = route.request();
  if (req.method() === 'PUT') {
    wrongShapePuts++;
    return route.fulfill({ status: 409, contentType: 'application/json', body: '{"message":"sha mismatch"}' });
  }
  return route.fulfill(remoteFile('{"notes":"something else wrote this"}', 'object-sha'));
});
await addNote('next to a foreign file');
await waitBadge('sync error');
step('a non-array remote stops the merge with a clear message',
  /not a JSON array/.test(await title()), await title());
step('after one attempt, rather than three blind retries', wrongShapePuts === 1, `${wrongShapePuts} PUTs`);
step('local notes are untouched', (await page.locator('.row-title:has-text("next to a foreign file")').count()) === 1);
await page.unroute(NOTES);

// ---- across everything: no PUT ever carried a bare null ----
const nullBodies = gh.calls.filter((c) => c.method === 'PUT' && c.body
  && Buffer.from(JSON.parse(c.body).content, 'base64').toString('utf8').trim() === 'null');
step('no PUT in this suite committed a literal null', nullBodies.length === 0);

step('no page errors', errors.length === 0, errors.join(' | '));
await done(browser);
