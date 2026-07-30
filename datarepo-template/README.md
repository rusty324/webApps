# Fitness Tracker — private data repo

This folder is a **template**. Copy its contents into a new **private** GitHub
repo; that repo is where the Fitness Tracker app stores your personal data.

Nothing here is served to the web. The app itself lives in a separate public
repo and reaches this one through the GitHub API using your personal access
token.

## Setup

1. **Create the repo.** New repository → name it something like
   `fitness-data` → **Private** → tick **Add a README** (this creates the
   default branch, which the API needs) → Create.
2. **Copy these files in**, preserving the layout:

   ```
   .github/workflows/strava-sync.yml
   scripts/strava-sync.mjs
   scripts/crypto.js
   ```

   The easiest route is to download this folder from the app repo and drag the
   files into GitHub's web uploader.
3. **Create a fine-grained token** (GitHub → Settings → Developer settings →
   Fine-grained tokens): repository access limited to **only this repo**,
   with **Contents: Read and write**, plus **Actions: Read and write** if you
   want the app's "Sync Strava now" button.
4. **Point the app at it**: open the app → ⚙ Settings → Data repository →
   enter the owner, repo name, and branch (`main`) → Save → paste the token.
   Then press **Upload all local data** once to seed this repo from the
   browser you have been using.

## Strava sync (optional)

The sync workflow lives here because it writes into `data/strava/`. Add these
repo secrets (Settings → Secrets and variables → Actions):

| Secret | Where it comes from |
|---|---|
| `STRAVA_CLIENT_ID` | strava.com/settings/api |
| `STRAVA_CLIENT_SECRET` | strava.com/settings/api |
| `STRAVA_REFRESH_TOKEN` | the one-time OAuth exchange in the app repo's README |
| `ENCRYPTION_PASSWORD` | only if you enabled encryption in the app |

The workflow then runs every four hours, and on demand from the Actions tab or
the app's "Sync Strava now" button.

To check it works: Actions → Strava sync → Run workflow. A successful run
either commits new activities to `data/strava/activities-YYYY-MM.json` or logs
"No new activities". If your shards are encrypted and `ENCRYPTION_PASSWORD` is
missing, the run fails loudly rather than writing mixed plaintext.

## What ends up here

```
data/plans.json        data/exercises.json    data/matches.json
data/logs.json         data/metrics.json      data/goals.json
data/strava/state.json data/strava/activities-YYYY-MM.json
```

The app creates these on first sync — you do not need to make them yourself.

`scripts/crypto.js` is a byte-identical copy of `js/crypto.js` in the app
repo, so the workflow can read and write the same encrypted format the browser
uses. If you ever update one, update both.
