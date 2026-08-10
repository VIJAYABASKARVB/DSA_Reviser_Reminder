# DSA Revision Reminder

Spaced-repetition tracker for LeetCode / Code360 / GFG problems. Google Sign-In, Firestore storage, dark UI, client-side notifications (no backend).

## Firebase setup (one-time)

1. Go to console.firebase.google.com → **Add project** (e.g. `dsa-reviser-reminder`).
2. **Build → Authentication → Sign-in method → Google → Enable** (set support email, save).
3. **Build → Firestore Database → Create database** → start in **production mode**; choose a region (e.g. `europe-west1` — for free tier pick a region without a paid plan, e.g. `eur3` or `nam5`).
4. **Project settings → Your apps → Web app** (`</>`) → register → copy the `firebaseConfig` values.
5. Copy `.env.example` → `.env` and fill in the six `VITE_FIREBASE_*` values.
6. Deploy the rules (see below) — required or reads/writes will fail.

## Deploy rules (required!)

Install CLI: `npm install -g firebase-tools`, then:

```
firebase login
firebase init firestore   # choose this repo, accept defaults
firebase deploy --only firestore:rules
```

## Run locally

```
npm install
npm run dev
```

- `/login` — Google sign-in (asks for notification permission on first login)
- `/` — dashboard: due today, next 7 days, weekend batch, stats, weekly chart
- `/add` — paste a problem URL, pick tags + difficulty
- `/problems` — full filterable/sortable list

## How spacing works

| Stage | Interval |
|-------|----------|
| 0 (new) | 1 day |
| 1 | 3 days |
| 2 | 7 days |
| 3 | 30 days |
| 4+ | Mastered (no reminders) |

Marking **Easy/Medium** advances the stage; **Hard** repeats the same interval. Revisions Mon–Fri queue the problem into the **Weekend batch**; revising on Sat/Sun clears it.

## Notes

- Notifications only fire while the browser/app is open (client-side only — no FCM backend).
- All data lives under `users/{uid}` and is private.