// The fitness tracker's Settings modal, which is now three ghsync sections
// plus three of its own. Also the setup checklist and the sync badge.
import { BASE, chromium, reporter, stubGithub } from './lib.mjs';

const { step, done } = reporter();
const browser = await (await chromium()).launch();
const page = await browser.newPage({ viewport: { width: 390, height: 820 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const gh = await stubGithub(page, { dirs: { 'data/activities': [], 'data/imported': [], 'data/strava': [] } });

const sections = () => page.evaluate(() =>
  [...document.querySelectorAll('.settings-section')].map((d) => ({ id: d.dataset.section, open: d.open })));
const marks = () => page.evaluate(() =>
  [...document.querySelectorAll('.check-row .mark')].map((m) => m.textContent.trim()).join(''));
// <details> summaries toggle, so ensure-open rather than click blindly.
const expand = (id) => page.evaluate((i) => {
  document.querySelector(`.settings-section[data-section="${i}"]`).open = true;
}, id);
const openSettings = async () => {
  await page.click('#settings-btn');
  await page.waitForSelector('.modal-title:has-text("Settings")');
};

await page.goto(BASE);
await page.waitForSelector('.tabbar button');
await page.evaluate(() => localStorage.setItem('ft.welcomed', '1'));

// ---- fresh profile ----
await openSettings();
step('checklist shows three unfinished steps', (await marks()) === '○○○', await marks());
const order = (await sections()).map((s) => s.id).join(',');
step('six sections in setup order', order === 'datarepo,token,activitysync,privacy,units,templates', order);
step('only the first unfinished section is open',
  (await sections()).filter((s) => s.open).map((s) => s.id).join(',') === 'datarepo');
step('badge starts local-only', (await page.textContent('#sync-badge')) === 'local only');

// ---- every action sits with its own input ----
await expand('token');
const tokenBtns = await page.evaluate(() =>
  [...document.querySelectorAll('.settings-section[data-section="token"] .settings-body button')].map((b) => b.textContent));
step('token section holds Save + Clear, and nothing else', tokenBtns.join(',') === 'Save token,Clear token', tokenBtns.join(','));
await page.click('.settings-section[data-section="token"] button:has-text("Save token")');
await page.waitForSelector('.toast.error');
step('empty Save token errors and keeps the modal open',
  (await page.locator('.modal-title:has-text("Settings")').count()) === 1
  && /Paste a token/.test(await page.locator('.toast.error').textContent()));

// ---- remote actions are gated with a stated reason ----
await expand('activitysync');
step('Sync activities now disabled before setup',
  await page.locator('button:has-text("Sync activities now")').isDisabled());
step('and says what is missing',
  /Set a data repository and a GitHub token first/.test(
    await page.locator('.settings-section[data-section="activitysync"] .settings-body').textContent()));
step('Upload all local data disabled too', await page.locator('button:has-text("Upload all local data")').isDisabled());

// ---- configure the data repo ----
await expand('datarepo');
step('owner pre-filled from the app repo', (await page.inputValue('.modal input[placeholder="github-username"]')) === 'rusty324');
await page.fill('.modal input[placeholder="fitness-data"]', 'my-private-data');
await page.click('button:has-text("Save data repo")');
await page.waitForSelector('.settings-section[data-section="token"][open]');
step('saving the repo reopens Settings focused on the token step', true);
step('checklist marks the repo done', (await marks()) === '✓○○', await marks());
step('data repo persisted',
  (await page.evaluate(() => JSON.parse(localStorage.getItem('ft.datarepo')))).repo === 'my-private-data');
step('a repo without a token still talks to nobody', gh.calls.length === 0, `${gh.calls.length} calls`);

// ---- save the token ----
await page.fill('.settings-section[data-section="token"] input[type="password"]', 'github_pat_fake');
await page.click('.settings-section[data-section="token"] button:has-text("Save token")');
await page.waitForFunction(() =>
  [...document.querySelectorAll('.check-row .mark')].map((m) => m.textContent.trim()).join('') === '✓✓○');
step('token persisted', (await page.evaluate(() => localStorage.getItem('ft.pat'))) === 'github_pat_fake');
step('badge leaves local-only', (await page.textContent('#sync-badge')) !== 'local only', await page.textContent('#sync-badge'));
step('validate probed the data repo, never the public app repo',
  gh.calls.some((c) => c.url === 'https://api.github.com/repos/rusty324/my-private-data')
  && !gh.calls.some((c) => c.url.includes('/webApps')),
  gh.calls.find((c) => c.url.includes('/webApps'))?.url ?? 'no validate call');

// ---- now the remote actions work ----
await expand('activitysync');
step('Sync activities now enabled once both are set',
  !(await page.locator('button:has-text("Sync activities now")').isDisabled()));
gh.reset();
await page.click('button:has-text("Sync activities now")');
await page.waitForSelector('.toast:has-text("Sync triggered")');
step('workflow_dispatch targets the data repo, not the app repo',
  gh.calls.some((c) => c.method === 'POST'
    && c.url === 'https://api.github.com/repos/rusty324/my-private-data/actions/workflows/polar-sync.yml/dispatches'),
  gh.calls.map((c) => c.url).join(' | '));

// ---- seeding the repo pushes every collection ----
gh.reset();
await expand('datarepo');
await page.click('button:has-text("Upload all local data")');
await page.waitForSelector('.toast:has-text("Uploaded all local data")', { timeout: 15000 });
const puts = gh.puts().map((c) => c.url.split('/contents/')[1]);
const expected = ['data/plans.json', 'data/exercises.json', 'data/logs.json', 'data/metrics.json',
  'data/matches.json', 'data/goals.json', 'data/activity-edits.json'];
step('upload PUTs every collection incl. activity edits',
  expected.every((f) => puts.includes(f)), puts.join(', '));
step('and only ever targets the private repo',
  gh.calls.every((c) => c.url.includes('/rusty324/my-private-data')));

// ---- checklist rows open their section ----
await page.evaluate(() => document.querySelectorAll('.settings-section').forEach((d) => { d.open = false; }));
await page.click('.check-row:has-text("GitHub token")');
step('tapping a checklist row opens that section', (await sections()).find((s) => s.id === 'token').open);

// ---- privacy ----
gh.reset();
await expand('privacy');
await page.fill('.settings-section[data-section="privacy"] input[type="password"]', 'hunter2');
await page.click('button:has-text("Enable encryption")');
await page.waitForSelector('.toast:has-text("Encryption enabled")');
await page.waitForSelector('.settings-section[data-section="privacy"][open]');
step('privacy summary updates',
  (await page.textContent('.settings-section[data-section="privacy"] .sec-state')) === 'encryption on');
step('logs are pushed as an envelope', /"format": "ft-encrypted"/.test(gh.putBody('data/logs.json')));
step('plans stay plaintext', !/ft-encrypted/.test(gh.putBody('data/plans.json')));

// ---- the app's own sections still work ----
await expand('units');
step('units summary shows current units',
  (await page.textContent('.settings-section[data-section="units"] .sec-state')) === 'kg · km · cm');
await page.selectOption('.settings-section[data-section="units"] select >> nth=0', 'lb');
await page.click('.modal-actions button:has-text("Close")');
await page.click('.segmented button:has-text("Today")');
step('a unit change re-renders the app',
  (await page.getAttribute('.card:has-text("Morning weigh-in") input', 'placeholder')) === 'lb');

await openSettings();
await expand('templates');
const [dl] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button:has-text("Download plan template")'),
]);
step('plan template still downloads', dl.suggestedFilename() === 'example.plan.json');

step('no page errors', errors.length === 0, errors.join(' | '));
await done(browser);
