# Brief: innovation competencies map

## What this is

A single static web page (`index.html`) that eight people open at the same time during a 60-minute team session. Each person picks their name, marks their own column against the 14 skills and 9 attitudes of Nesta's Competency Framework for Experimenting and Public Problem Solving, and the marks sync live through a Firebase Realtime Database so everyone ends up looking at the same heat map. Hosted on GitHub Pages. No accounts for participants.

The page is already written. The job is to wire it up, prove it works with two browsers against the real database, deploy it, and keep it exactly this simple.

## The session it serves

Eight people: Tim (facilitator), Connie (director), Jenny, Alex, Agnese, Stas, Lavanya, Jenn. All senior experts in the IB's Education Innovation department. Hybrid: some in The Hague, some in the US.

Run of the session:
1. 0–5 min: purpose and rules (not scored; nobody has all of these; teams not heroes)
2. 5–10: orient to the framework
3. 10–25: silent mapping; the map is hidden from everyone
4. 25–35: round: each person's superpower and one thing to develop
5. 35–52: facilitator reveals the map; discussion using four prompts (collective strengths, gaps on the map, single points of failure, shared development interest); each person writes one observation, then shares it; the facilitator switches on a connections step
6. 52–60: summary exported

## Rules the page enforces

- Exactly these marks per person: 5 skills as strengths, 3 attitudes as strengths, 1 superpower (must be one of the 5 skills), 2 skills to develop (cannot also be strengths).
- The team map is hidden until the facilitator reveals it. The reveal control is shown to whoever has picked "Tim".
- One observation per person, written after the reveal with a sentence stem, shared with everyone.
- A connections step, switched on by Tim, that shows strengths only one person has and development pairs; hidden at reveal so the first readings name nobody.
- Copy and download a plain-text summary.
- Download the map as an Excel workbook (built in plain JavaScript, no library).
- A reset control, shown only to whoever picked Tim, that downloads the Excel copy first, then clears everyone's marks, the revealed flag and the observations after a confirmation.
- An editable session name, shown to Tim, shared with everyone, defaulting to the date and time in the Netherlands in plain words.
- Save a snapshot (Tim only) copies the current map into archive/<timestamp> in the database; reset saves a snapshot first and refuses to clear if that fails.

## Data model (Firebase Realtime Database, test mode)

```
map/
  marks/<personId>   { skills: [], attitudes: [], star: id|null, develop: [], updatedAt }
  config             { revealed, sessionName, connections, updatedAt }
  observations/<personId> { text, updatedAt }
archive/<timestamp>  { name, savedAt, data }
```

Person ids: tim, connie, jenny, alex, agnes, stas, lavanya, jen.

## Style constraints (do not change)

- Single file, no build step, no framework. Vanilla JS.
- No all-caps labels, no tracked-out text, no centre-dot separators between items.
- Sentence case everywhere. Plain language.
- Keep the existing palette and typography unless something is broken.

## Acceptance criteria

1. With `FIREBASE_CONFIG` filled in, the page loads with no console errors and the "live sharing isn't connected" notice does not appear.
2. Two separate browser contexts (Playwright) pick different names, place marks, and each sees the other's marks in the team map within 3 seconds of reveal.
3. Marks placed before a page reload survive the reload for the same name.
4. The count limits are enforced: a sixth skill, fourth attitude, second superpower, or third develop cannot be placed; superpower cannot be placed on a non-strength; develop cannot be placed on a strength.
5. Reveal toggles the map for all open browsers. Only the browser that picked Tim sees the reveal control.
6. An observation typed by one person appears in every other browser's list without overwriting text being typed there.
7. "Copy summary" and "Download summary" both produce the text summary containing every row, every observation and the connections.
8. Layout works at 380px wide (the marks buttons wrap; the map scrolls sideways inside its container, the page does not).
9. Deployed on GitHub Pages and reachable at the public URL.
10. README explains setup in the words of SETUP.md, plus how to clear the database between runs.
11. Reset, available only to Tim, asks for confirmation, downloads the Excel file, and empties `map/` so every open browser shows a blank map within 3 seconds.
12. "Download as Excel" produces a valid .xlsx containing every row, every observation and the connections.
13. The session name defaults to the Netherlands date and time in words, can be edited by Tim, appears in every browser, and heads the text and Excel summaries.
14. Save a snapshot writes archive/<timestamp> with the session name and the current map; reset writes one before clearing.
15. At reveal the readings are collective strengths, gaps on the map and skills several of us want to develop; no reading or row flag names a single person until the connections step.
16. Show the connections is visible only to Tim, toggles for every browser within 3 seconds, and lists strengths only one person has and development pairs in the form "Alex wants to develop brokering; it is a strength for Connie and Stas."

## Out of scope

Authentication, user accounts, a backend beyond Firebase, styling changes, additional frameworks, analytics, any feature not listed above.
