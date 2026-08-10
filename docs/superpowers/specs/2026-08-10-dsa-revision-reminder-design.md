# DSA Revision Reminder — Design Spec

Date: 2026-08-10
Status: Approved (Approach A — spec as written, client-side only)

## 1. Overview

A Vite + React 18 + Tailwind CSS v3 single-page app that helps users revise DSA problems using fixed spaced repetition. Google Sign-In via Firebase Auth; all problem data stored per-user in Firestore subcollections. No backend — all logic is client-side.

## 2. Tech Stack

- Vite + React 18
- Tailwind CSS v3, dark theme (dark grays, not pure black), indigo/purple accent
- Firebase v10 (Auth, Firestore); **no FCM** — notifications use the Browser Notification API + service worker
- react-router-dom v6, react-hot-toast, recharts, date-fns
- Firebase config via `import.meta.env.VITE_*` placeholders + setup guide in README

## 3. Auth

- Google Sign-In only, via Firebase Auth popup.
- `useAuth` hook wraps `onAuthStateChanged`.
- `/login` is public; `/`, `/problems`, `/add` are wrapped in a `ProtectedRoute` that redirects to `/login` when unauthenticated.
- Navbar shows avatar + name + logout button.

## 4. Firestore Schema

Collection: `users/{uid}/problems/{problemId}`

```
{
  uid, title, url, platform, tags[], difficulty,
  addedAt, lastRevisedAt, nextRevisionDate,
  revisionStage: 0,
  confidenceHistory: [{date, rating}],
  isWeekend: false
}
```

Collection: `users/{uid}/meta` → `{ streak, lastRevisionDate, customTags[] }`

## 5. Add Problem Flow

1. User pastes a URL from LeetCode / Code360 / GFG.
2. `urlParser.js` extracts title from slug (kebab-case → Title Case, strips problem-id suffixes like `-leetcode` / `-geeksforgeeks`) and detects platform from domain:
   - `leetcode.com/problems/...` → LeetCode (orange badge)
   - `codingninjas.com/studio/...`, `naukri.com/code360/...` → Code360 (blue badge)
   - `geeksforgeeks.org/problems/...`, `practice.geeksforgeeks.org/...` → GFG (green badge)
3. User picks tags (multi-select from the 24 patterns + "Custom" where a new tag name is saved to `meta.customTags` and reusable).
4. User picks difficulty Easy / Medium / Hard.
5. Save via `writeBatch`: problem doc (`stage: 0`, `addedAt`, `nextRevisionDate = today + 1d`) + meta (customTags append).
6. Toast "Problem added".

## 6. Revision Interval Logic (`intervalLogic.js`)

- Stage 0 → 1 day, Stage 1 → 3 days, Stage 2 → 7 days, Stage 3 → 30 days, Stage 4+ → Mastered (shown in All Problems, no due reminders).
- `getNextRevisionDate(stage, from)` and `nextStage(afterStage, rating)` helpers.
- Confidence modal (blocks interaction until picked):
  - Easy → advance one stage
  - Medium → advance one stage
  - Hard → stay at current stage (repeat same interval)
- On revise, batch update: `lastRevisedAt`, `nextRevisionDate`, `revisionStage`, push `{date, rating}` to `confidenceHistory`, `isWeekend` per rules below, plus streak update in meta.

## 7. Weekend Batch

- Revision marked Mon–Fri → `isWeekend: true` (joins the weekend batch).
- Revision marked Sat–Sun → `isWeekend: false` (self-cleaning; un-revised items stay listed until eventually revised).
- Weekend section visible always; shows "X problems to revise this weekend" and a Revise Now button per item.

## 8. Streak & Stats

- Streak stored in meta. On revision: `lastRevisionDate === yesterday` → +1; `=== today` → unchanged; otherwise → reset to 1.
- Stats bar: current streak, total problems, revised today, mastered count.
- WeeklyChart: recharts BarChart, 7 buckets Mon–Sun derived from `confidenceHistory` dates across all problems of the current week.

## 9. Pages

- `/login` — Google Sign-In page (branded panel, sign-in button, feature blurb).
- `/` — Dashboard: Due Today (with count badge), Upcoming Revisions (next 1–7 days, days-remaining chip), Weekend Revision, StatsBar + WeeklyChart, and a compact All Problems list (5 most recent, sorted by next revision date) with a "View All" link to `/problems`. The full filterable list lives on `/problems`.
- `/problems` — Full list: table on desktop / card list on mobile; filter by platform, difficulty, tag, status (due/upcoming/mastered); sort by next revision date, date added, difficulty.
- `/add` — Add Problem form.

## 10. Components

- `Navbar.jsx`, `ProblemCard.jsx`, `ConfidenceModal.jsx`, `AddProblemForm.jsx`, `StatsBar.jsx`, `WeeklyChart.jsx`.

## 11. Real-time & Writes

- `onSnapshot` for `problems` and `meta` — dashboard updates instantly.
- `writeBatch` for problem+meta writes. Unsubscribe on unmount.
- Listener errors surface a retry banner, not a crash.

## 12. Notifications

- On first login, request `Notification.requestPermission()`.
- `public/sw.js` registered as service worker; while the app is open, a timer schedules the next 9:00 AM reminder; if problems are due when it fires, show a Notification and re-arm for the next day.
- No FCM / no backend. If browser closed, no notification (accepted tradeoff).

## 13. Firestore Security

- `firestore.rules`: problems and meta gated on `request.auth.uid == uid`.
- `firestore.indexes.json`: composite index `(uid, nextRevisionDate desc, addedAt desc, difficulty)` for All Problems sort/filter combos.

## 14. Error Handling

- URL validation: unsupported domain → inline error + toast; empty tags blocked; difficulty required.
- Firestore write failures → toast, no partial state.

## 15. Testing

- None (user choice). Verification = `npm run build` + manual walkthrough.

## 16. Deliverables

- Full app per folder structure in the original request.
- `README.md` with Firebase setup steps (create project, enable Auth/Google, create Firestore db, create web app, copy env keys, deploy rules + indexes).
- `.env.example` with placeholder keys.