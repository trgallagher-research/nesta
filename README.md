# Innovation competencies map

A single static web page (`index.html`) that eight people open at the same time during a 60-minute team session. Each person picks their name, marks their own column against the 14 skills and 9 attitudes of Nesta's Competency Framework for Experimenting and Public Problem Solving, and the marks sync live through a Firebase Realtime Database so everyone ends up looking at the same heat map. Hosted on GitHub Pages. No accounts for participants.

## Setup

The page is a single static file (`index.html`). It needs one shared store so eight browsers see the same map. Firebase Realtime Database in test mode gives you that in about ten minutes, with no accounts for the participants.

### 1. Create the database

1. Go to https://console.firebase.google.com and add a project (any name; turn Google Analytics off).
2. In the left menu choose Build, then Realtime Database, then Create database. Pick a European location (for example `europe-west1`). Choose "Start in test mode".
3. Test mode lets anyone with the database URL read and write for 30 days. That is fine for a one-off session. Delete the project afterwards, or tighten the rules.

### 2. Get the web config

In this repository the config is already filled in for the project `nesta-8e5fe`, so if you're reusing this repo as-is you can skip this step.

If you're making your own copy:

1. Project settings (gear icon), then "Your apps", then the `</>` web icon. Register the app (no hosting needed).
2. Copy the `firebaseConfig` object it shows.
3. Open `index.html` and paste the values into `FIREBASE_CONFIG` near the top. Make sure `databaseURL` is included; if the snippet doesn't show one, copy the URL from the Realtime Database page (it looks like `https://<project>-default-rtdb.europe-west1.firebasedatabase.app`).

## Publish on GitHub Pages

1. Put `index.html` in a repository (root, or a `docs/` folder).
2. Settings, then Pages, then Source: Deploy from a branch. Choose the branch and folder.
3. The page appears at `https://<you>.github.io/<repo>/` within a minute or two.

For this repository, Pages is enabled at Settings, then Pages, Source "Deploy from a branch", branch `main`, folder `/ (root)`. The public URL is:

https://trgallagher-research.github.io/nesta/

## Running a session

Open the page, pick Tim, place a few marks. Open it in a second browser (or on your phone), pick another name, and check the first browser's map updates once you press "Reveal the map to everyone". At the end, "Copy summary", "Download summary" and "Download as Excel" export the map and the three observations. Then clear your test marks.

The session itself runs to a tight schedule, in outline:

1. 0–5 min: purpose and rules
2. 5–10 min: orient to the framework
3. 10–25 min: silent mapping (the map stays hidden)
4. 25–35 min: each person's superpower and one thing to develop
5. 35–52 min: facilitator reveals the map, then discussion
6. 52–60 min: three observations typed into the page, summary exported

## Clearing the database between sessions

Any of these removes everything under `map/` in the database: all marks, the revealed flag, and the three observations. Download or copy the summary first if you want to keep a record.

1. In the page itself: pick Tim, reveal the map, press "Reset for a new session", and confirm. An Excel copy of the map downloads first, then everyone's marks and the observations are cleared for all open browsers.
2. From a checkout, after `npm install`, run `npm run clear`.
3. Or run this single command:
   ```
   curl -X DELETE "https://nesta-8e5fe-default-rtdb.europe-west1.firebasedatabase.app/map.json"
   ```
4. Or in the Firebase console, go to Build, then Realtime Database, hover over the `map` node, and use the delete (bin) icon.

## Testing

Run `npm install`, then `npm test` to run the Playwright acceptance tests. These run against the real database and clear `map/` before and after the run, so do not run them during a live session.

You'll need Node 18 or later. The first `npm install` may prompt Playwright to download a browser — if so, run `npx playwright install chromium`.

## Deleting the Firebase project afterwards

Test mode rules expire after 30 days, after which writes fail. To delete the project:

1. Firebase console, gear icon, Project settings.
2. Scroll to the bottom and choose "Delete project".
3. Type the project id `nesta-8e5fe` to confirm.

Deletion is scheduled rather than immediate, and can be undone for about 30 days.

Alternatively, keep the project and tighten the rules instead: in Build, then Realtime Database, then Rules, set:

```json
{ "rules": { ".read": false, ".write": false } }
```

## Notes

- The reveal button shows for whoever has picked Tim. There's no login; the eight names are trust-based.
- Data lives under `map/` in the database: `marks/<person>`, `config`, `notes`. You can inspect or delete it from the Firebase console.
- The "Download summary" button saves a plain-text version of the grid and the three observations.
