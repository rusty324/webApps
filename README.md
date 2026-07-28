# Fitness Tracker & Planner

A single-user fitness tracking and planning web app that runs entirely on
GitHub Pages — no backend. Data is saved as JSON files in this branch via the
GitHub Contents API, with localStorage as a write-through cache so the app
works offline and syncs when you're back online. Strava activities sync in
automatically via a scheduled GitHub Actions workflow.

*(This branch is one app in the webApps collection — GitHub Pages serves
whichever branch is selected in the repo's Pages settings.)*

## Features

- **Training Plans** — structured multi-week plans (weeks → sessions → blocks
  → exercises) with phases, deload weeks, and rich targets (rep ranges,
  holds, rest, RPE, variant levels, intervals). List and calendar views;
  multiple concurrent plans. Plans import/export as portable
  `fitness-tracker-plan` v2 JSON (see below).
- **Fitness Library** — the shared exercise library (descriptions, cues,
  safety notes, difficulty variants, per-set RWI history) plus **Goals**:
  bodyweight targets, run-time goals (1 mile / 5k / 10k / custom), and
  exercise goals, each with live progress against your logs.
  RWI (Relative Work Index) = (reps or seconds per set) × (goal weight ÷
  body weight on the day), normalizing bodyweight work as your weight moves
  toward its goal.
- **Logs** — today's planned session with inline logging, a one-tap morning
  weigh-in on the Today view, ad-hoc entries, filterable history, body metrics
  (weight, body fat %, resting HR, waist — extensible via `BODY_METRICS` in
  `js/config.js`), per-metric trend charts plus pace/distance charts, and a
  plan-adherence percentage.
- **Strava sync** — a scheduled workflow pulls new activities into
  `data/strava/`; a fuzzy matcher suggests links between synced activities and
  planned sessions (one-tap confirm/reject).
- **GPS heatmap** — accumulated route density across all synced activities
  with GPS data (Leaflet + leaflet.heat, OpenStreetMap tiles).

## Setup

### 1. Enable GitHub Pages

Repo → Settings → Pages → deploy from branch `fitnessTracker`, root folder.
The app then lives at `https://<user>.github.io/webApps/`.

> ⚠️ **Privacy**: if this repo is public, everything the app saves —
> including GPS routes of your runs — is publicly visible. Consider making
> the repo private (branch-based Pages on private repos requires GitHub Pro).

### 2. Create a personal access token (for saving data)

GitHub → Settings → Developer settings → **Fine-grained tokens**:

- Repository access: **only this repo**
- Permissions: **Contents: Read and write**, plus **Actions: Read and write**
  if you want the in-app "Sync Strava now" button
- Expiry: your call (you'll re-paste it when it expires)

Open the app, tap ⚙ Settings, paste the token. It's stored only in that
browser's localStorage and only sent to `api.github.com`. Without a token the
app still works in local-only mode (data stays in the browser).

⚙ Settings also has **unit preferences** — weight (kg/lb), distance (km/mi,
which also flips pace between min/km and min/mi), and body measurements
(cm/in). Units are a per-browser display setting: stored JSON, Strava data,
and exported plan templates are always metric (kg / meters / cm), converted
at the UI only, so switching units never rewrites data.

### 3. Strava sync (optional, one-time)

1. Create an API application at <https://www.strava.com/settings/api>
   (category "personal"). Note the **Client ID** and **Client Secret**.
2. Authorize your own app — visit (with your client id):

   ```
   https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
   ```

   Approve; you land on `http://localhost/?code=AUTH_CODE...` — copy the code.
3. Exchange the code for a refresh token:

   ```sh
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=CLIENT_ID -d client_secret=CLIENT_SECRET \
     -d code=AUTH_CODE -d grant_type=authorization_code
   ```

   Copy `refresh_token` from the response.
4. Repo → Settings → Secrets and variables → Actions → add three secrets:
   `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN`.

The `Strava sync` workflow then runs every 4 hours (or on demand from the
Actions tab / the in-app button) and commits new activities to
`data/strava/activities-YYYY-MM.json`. Strava credentials never reach the
browser — the site only reads the synced JSON.

## Encryption (optional)

If the repo is public (or you just want data at rest protected), set an
encryption password in ⚙ Settings → Privacy. From then on **logs, body
metrics, goals, and Strava GPS shards** are committed as AES-256-GCM envelopes
(key derived from your password with PBKDF2, 310k iterations) instead of
readable JSON. Plans, the exercise library, and match links stay plaintext.

- For Strava sync to keep working, add the same password as a repo Actions
  secret named `ENCRYPTION_PASSWORD`. If the secret is missing while shards
  are encrypted, the sync fails loudly rather than writing mixed plaintext.
- The password is remembered in this browser's localStorage (same trust
  model as the PAT). On a new device, enter it once in Settings to unlock.
- **No recovery**: a lost password makes the encrypted data unreadable.
- Files committed *before* enabling encryption remain readable in git
  history. If that matters, rewrite history or start the data files fresh.
- Disabling encryption in Settings decrypts and re-commits everything as
  plaintext.

## Plan templates (import / export)

Plans import and export in the **`fitness-tracker-plan` v2 schema**: a
`plan` metadata object (goal, level, durationWeeks…), an `exerciseLibrary`
map of snake_case ids → full exercise definitions (description, cues,
safety notes, variants), optional `phases` and `blockTemplates`, and
`weeks[] → sessions[] → blocks[] → items[]` where each item is an
`exerciseId` reference plus a `target`. Target kinds: `reps` (with `reps`
or `repsMin`/`repsMax`, optional `weight`, `holdSec`), `duration`,
`distance` (with `paceSecPerKm`), and `intervals` (`rounds`, `workSec`,
`recoverySec`); all support `sets`, `restSec`, `rpe`, `tempo`,
`variantLevel`, `perSide`. All stored values are metric.

**Import** (Plans tab) accepts a pasted or uploaded v2 file — older v1
templates still work — and asks for a start date (the calendar day that
`dayOffset: 0` maps to). Library exercises are matched by name,
case-insensitively; missing ones are created with their full definitions,
and `blockTemplates` are materialized into the sessions that reference
them. **Export** (plan detail page) produces the same format; ⚙ Settings
has a starter template download. Scheduling stays relative (dayOffset), so
exported files re-import with any fresh start date.

## Development

No build step — plain ES modules. Serve the branch root over HTTP:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Without a token the app runs in local-only mode, which is also how the UI is
tested. To test the sync script locally:

```sh
STRAVA_CLIENT_ID=… STRAVA_CLIENT_SECRET=… STRAVA_REFRESH_TOKEN=… \
  node scripts/strava-sync.mjs
```

### Layout

| Path | What |
|---|---|
| `js/config.js` | Tab registry, Strava type→category map, data file paths |
| `js/storage/` | GitHub Contents API client, localStorage cache, store |
| `js/ui/` | Tab modules (plans, logs, heatmap) + shared components |
| `js/matcher.js` | Fuzzy matcher (pure functions) |
| `scripts/strava-sync.mjs` | Actions-run Strava sync (zero dependencies) |
| `data/` | JSON data written by the app; `data/strava/` written only by Actions |
| `vendor/` | Vendored Leaflet, leaflet.heat, polyline decoder |

Data-write ownership: the browser owns everything under `data/` except
`data/strava/`, which only the workflow writes — so the two writers can never
conflict. Strava↔plan match decisions live in `data/matches.json` (browser-
owned) rather than in the Strava files themselves.
