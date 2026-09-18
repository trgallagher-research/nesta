# Competency map — setup

The page is a single static file (`index.html`). It needs one shared store so eight browsers see the same map. Firebase Realtime Database in test mode gives you that in about ten minutes, with no accounts for the participants.

## 1. Create the database

1. Go to https://console.firebase.google.com and add a project (any name; turn Google Analytics off).
2. In the left menu choose Build, then Realtime Database, then Create database. Pick a European location (for example `europe-west1`). Choose "Start in test mode".
3. Test mode lets anyone with the database URL read and write for 30 days. That is fine for a one-off session. Delete the project afterwards, or tighten the rules.

## 2. Get the web config

1. Project settings (gear icon), then "Your apps", then the `</>` web icon. Register the app (no hosting needed).
2. Copy the `firebaseConfig` object it shows.
3. Open `index.html` and paste the values into `FIREBASE_CONFIG` near the top. Make sure `databaseURL` is included; if the snippet doesn't show one, copy the URL from the Realtime Database page (it looks like `https://<project>-default-rtdb.europe-west1.firebasedatabase.app`).

## 3. Publish on GitHub Pages

1. Put `index.html` in a repository (root, or a `docs/` folder).
2. Settings, then Pages, then Source: Deploy from a branch. Choose the branch and folder.
3. The page appears at `https://<you>.github.io/<repo>/` within a minute or two.

## 4. Test before Tuesday

Open the page, pick Tim, place a few marks. Open it in a second browser (or on your phone), pick another name, and check the first browser's map updates once you press "Reveal the map to everyone". Then clear your test marks.

## Notes

- The reveal button shows for whoever has picked Tim. There's no login; the eight names are trust-based.
- Data lives under `map/` in the database: `marks/<person>`, `config`, `notes`. You can inspect or delete it from the Firebase console.
- The "Download summary" button saves a plain-text version of the grid and the three observations.
