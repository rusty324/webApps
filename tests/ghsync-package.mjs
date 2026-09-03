// The ghsync package on its own, driven through ghsync/example — a different
// app with a different appId and its own collection. If this passes, the
// package really is portable; the fitness app is just one consumer.
import { BASE, chromium, reporter, stubGithub } from './lib.mjs';

const { step, done } = reporter();
const browser = await (await chromium()).launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const gh = await stubGithub(page);
const keys = () => page.evaluate(() => Object.keys(localStorage).sort());
const notes = () => page.evaluate(() => JSON.parse(localStorage.getItem('notes.data.data/notes.json') ?? '[]'));
const open = async (section) => {
  if (await page.locator('#settings').isHidden()) await page.click('#settings-btn');
  await page.evaluate((id) => {
    document.querySelector(`.settings-section[data-section="${id}"]`).open = true;
  }, section);
};

await page.goto(`${BASE}/ghsync/example/`);
await page.waitForSelector('#badge');

// ---- local-only until a repo AND a token exist ----
step('starts local-only', (await page.textContent('#badge')) === 'local only');
await page.fill('#new-note', 'first note');
await page.click('#add-note');
await page.waitForSelector('.row-title:has-text("first note")');
step('a note is stored locally', (await notes()).length === 1);
step('with no data repo, nothing is sent to GitHub', gh.calls.length === 0, `${gh.calls.length} calls`);
step('all keys are namespaced by appId',
  (await keys()).every((k) => k.startsWith('notes.')), (await keys()).join(','));

// ---- the drop-in settings panel ----
await page.click('#settings-btn');
await page.waitForSelector('.settings-section');
const sections = await page.evaluate(() =>
  [...document.querySelectorAll('.settings-section')].map((d) => d.dataset.section));
step('three sync sections rendered', sections.join(',') === 'datarepo,token,privacy', sections.join(','));
step('checklist starts unfinished',
  (await page.evaluate(() => [...document.querySelectorAll('.check-row .mark')].map((m) => m.textContent.trim()).join(''))) === '○○');

await open('datarepo');
await page.fill('.settings-section[data-section="datarepo"] input[placeholder="my-notes-data"]', 'notes-data');
await page.fill('.settings-section[data-section="datarepo"] input[placeholder="github-username"]', 'someone');
await page.click('button:has-text("Save data repo")');
await page.waitForSelector('.toast');
step('repo saved under the app namespace',
  (await page.evaluate(() => JSON.parse(localStorage.getItem('notes.datarepo')))).repo === 'notes-data');

await open('token');
await page.fill('.settings-section[data-section="token"] input[type="password"]', 'github_pat_fake');
await page.click('button:has-text("Save token")');
await page.waitForFunction(() => document.getElementById('badge').textContent !== 'local only');
step('token saved under the app namespace',
  (await page.evaluate(() => localStorage.getItem('notes.pat'))) === 'github_pat_fake');
step('validate probed the configured repo',
  gh.calls.some((c) => c.url === 'https://api.github.com/repos/someone/notes-data'));

// ---- writes now reach the repo ----
gh.reset();
await page.fill('#new-note', 'synced note');
await page.click('#add-note');
await page.waitForSelector('.row-title:has-text("synced note")');
await page.waitForFunction(() => document.getElementById('badge').textContent === 'synced');
const put = gh.puts()[0];
step('the note is PUT to the private repo',
  put?.url === 'https://api.github.com/repos/someone/notes-data/contents/data/notes.json', put?.url);
step('and the body carries the record', /synced note/.test(gh.putBody('notes.json')));

// ---- seeding a fresh repo ----
gh.reset();
await open('datarepo');
await page.click('button:has-text("Upload all local data")');
await page.waitForSelector('.toast:has-text("Uploaded all local data")');
step('upload writes every collection',
  gh.puts().map((c) => c.url.split('/contents/')[1]).join(',') === 'data/notes.json');

// ---- optional encryption ----
gh.reset();
await open('privacy');
await page.fill('.settings-section[data-section="privacy"] input[type="password"]', 'hunter2');
await page.click('button:has-text("Enable encryption")');
await page.waitForSelector('.toast:has-text("Encryption enabled")');
const body = gh.putBody('notes.json');
step('the pushed file is an AES-GCM envelope', /"format": "ft-encrypted"/.test(body), body.slice(0, 60));
step('and the plaintext is not in it', !/synced note/.test(body));
step('the local cache stays plaintext', (await notes()).some((n) => n.text === 'synced note'));
step('notes still render with encryption on',
  (await page.locator('.row-title:has-text("synced note")').count()) === 1);

// ---- offline: writes queue instead of failing ----
await page.evaluate(() => { Object.defineProperty(navigator, 'onLine', { value: false, configurable: true }); });
await page.fill('#new-note', 'offline note');
await page.click('#add-note');
await page.waitForSelector('.row-title:has-text("offline note")');
step('an offline write is queued, not lost',
  (await page.evaluate(() => JSON.parse(localStorage.getItem('notes.queue') ?? '[]'))).includes('data/notes.json'));
step('badge shows pending', (await page.textContent('#badge')) === 'pending sync');
gh.reset();
await page.evaluate(() => {
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  window.dispatchEvent(new Event('online'));
});
await page.waitForFunction(() => document.getElementById('badge').textContent === 'synced');
step('coming back online flushes the queue',
  gh.puts().length === 1 && (await page.evaluate(() => JSON.parse(localStorage.getItem('notes.queue') ?? '[]'))).length === 0);

// ---- a second device wrote the same file: merge, don't clobber ----
await page.evaluate(() => localStorage.removeItem('notes.enc.pw')); // simpler assertions
let conflicted = false;
await page.route('https://api.github.com/**/contents/data/notes.json**', async (route) => {
  const req = route.request();
  if (req.method() === 'PUT' && !conflicted) {
    conflicted = true;
    return route.fulfill({ status: 409, contentType: 'application/json', body: '{"message":"conflict"}' });
  }
  if (req.method() === 'GET' && conflicted) {
    const remote = JSON.stringify([{ id: 'other-device', text: 'from the phone', createdAt: '2026-01-01T00:00:00Z' }]);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: Buffer.from(remote).toString('base64'), sha: 'remote-sha' }),
    });
  }
  return route.fallback();
});
await page.fill('#new-note', 'local note');
await page.click('#add-note');
await page.waitForSelector('.row-title:has-text("from the phone")');
const merged = await notes();
step('a conflicting push merges both sides by id',
  merged.some((n) => n.id === 'other-device') && merged.some((n) => n.text === 'local note'),
  merged.map((n) => n.text).join(' | '));
step('conflict resolved without losing the local record', conflicted);

step('no page errors', errors.length === 0, errors.join(' | '));
await done(browser);
