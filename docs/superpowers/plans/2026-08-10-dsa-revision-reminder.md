# DSA Revision Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side-only DSA revision reminder: Google auth, Firestore problem store, fixed spaced repetition (1d/3d/7d/30d), weekend batch, streak/stats, and browser notifications.

**Architecture:** Single Vite SPA. `useAuth` gates routes via `ProtectedRoute`. `useProblems`/`useStreak` subscribe with `onSnapshot`. Pure logic (URL parsing, interval math, date helpers) lives in `src/utils` with no Firebase imports. All writes touching problem + meta use `writeBatch`. Notifications: Browser Notification API + `public/sw.js` + an in-app timer for a 9:00 AM reminder (no FCM, no backend).

**Tech Stack:** Vite 5, React 18, Tailwind CSS v3 (dark theme, indigo accent), Firebase v10 (Auth + Firestore), react-router-dom v6, react-hot-toast, recharts, date-fns.

**Commit policy:** No git commits (repo not initialized by user request); a final optional `git init` step is listed at the end.

---

### Task 1: Scaffold Vite + React + Tailwind project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `postcss.config.js`, `tailwind.config.js`, `src/index.css`, `.gitignore`, `.env.example`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "dsa-reviser-reminder",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "date-fns": "^2.30.0",
    "firebase": "^10.12.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.24.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DSA Revision Reminder</title>
  </head>
  <body class="bg-gray-950">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#0b0f19',
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Create `.gitignore`**

```
node_modules
dist
.env
.env.local
```

- [ ] **Step 8: Create `.env.example`**

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: `added N packages`, no errors.

- [ ] **Step 10: Verify dev server boots**

Run: `npm run dev`
Expected: Vite prints a local URL, no compile errors. Kill the process.

---

### Task 2: Firebase config + auth module + useAuth

**Files:**
- Create: `src/firebase/config.js`, `src/firebase/auth.js`, `src/hooks/useAuth.js`

- [ ] **Step 1: Create `src/firebase/config.js`**

```js
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
```

- [ ] **Step 2: Create `src/firebase/auth.js`**

```js
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { app } from './config.js'

export const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function logOut() {
  return signOut(auth)
}
```

- [ ] **Step 3: Create `src/hooks/useAuth.js`**

```js
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/auth.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds with no errors (empty env values are fine at build time).

---

### Task 3: Pure logic utilities + constants

**Files:**
- Create: `src/utils/urlParser.js`, `src/utils/intervalLogic.js`, `src/utils/dateHelpers.js`, `src/constants.js`

- [ ] **Step 1: Create `src/utils/urlParser.js`**

```js
export const PLATFORM_META = {
  leetcode: { id: 'leetcode', label: 'LeetCode' },
  code360: { id: 'code360', label: 'Code360' },
  gfg: { id: 'gfg', label: 'GFG' },
}

export function slugToTitle(slug) {
  return slug
    .split('-')
    .filter((w) => w.length > 0 && !/^\d+$/.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function detectPlatform(hostname) {
  const h = hostname.toLowerCase()
  if (h.includes('leetcode.com')) return 'leetcode'
  if (h.includes('codingninjas.com') || h.includes('code360') || h.includes('naukri.com')) return 'code360'
  if (h.includes('geeksforgeeks.org')) return 'gfg'
  return null
}

export function extractTitleAndPlatform(url) {
  try {
    const u = new URL(url.trim())
    const platform = detectPlatform(u.hostname)
    if (!platform) return { ok: false }

    const segments = u.pathname.split('/').filter(Boolean)
    const idx = segments.indexOf('problems')
    let slug = idx >= 0 ? segments.slice(idx + 1) : []

    if (platform === 'gfg' && slug.length > 0 && /^\d+$/.test(slug[slug.length - 1])) {
      slug = slug.slice(0, -1)
    }

    if (slug.length === 0) return { ok: false }
    const title = slugToTitle(slug[0])
    if (!title) return { ok: false }
    return { ok: true, platform, title }
  } catch {
    return { ok: false }
  }
}
```

Handle cases: `leetcode.com/problems/two-sum/`, `leetcode.com/problems/two-sum`, `codingninjas.com/studio/problems/x/…`, `geeksforgeeks.org/problems/x/1`, `practice.geeksforgeeks.org/problems/x`.

- [ ] **Step 2: Create `src/utils/intervalLogic.js`**

```js
export const STAGE_DAYS = [1, 3, 7, 30]
export const MASTERED_STAGE = 4
export const STAGE_LABELS = ['New', 'Stage 1', 'Stage 2', 'Stage 3', 'Mastered']

export function nextStage(currentStage, rating) {
  if (rating === 'hard') return currentStage
  return Math.min(currentStage + 1, MASTERED_STAGE)
}

export function nextRevisionDate(currentStage, rating, fromDate = new Date()) {
  const stage = nextStage(currentStage, rating)
  if (stage >= MASTERED_STAGE) return null
  const next = new Date(fromDate)
  next.setDate(next.getDate() + STAGE_DAYS[stage])
  return next
}
```

- [ ] **Step 3: Create `src/utils/dateHelpers.js`**

```js
import { isSameDay } from 'date-fns'

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const isToday = (d) => isSameDay(new Date(d), new Date())

export function isWeekend(d = new Date()) {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function daysUntil(date) {
  const a = startOfDay(new Date())
  const b = startOfDay(new Date(date))
  return Math.round((b - a) / 86400000)
}

export function isYesterday(d) {
  return isSameDay(new Date(d), addDays(new Date(), -1))
}
```

- [ ] **Step 4: Create `src/constants.js`**

```js
export const TAGS = [
  'Array', 'Two Pointer', 'Sliding Window', 'Binary Search', 'Tree', 'Graph',
  'BFS', 'DFS', 'Dynamic Programming', 'Stack', 'Queue', 'Heap', 'Linked List',
  'Backtracking', 'Greedy', 'Recursion', 'Hashing', 'String', 'Bit Manipulation',
  'Math', 'Monotonic Stack', 'Divide & Conquer', 'Trie', 'Segment Tree',
]

export const DIFFICULTIES = ['easy', 'medium', 'hard']

export const STATUS_OPTIONS = [
  { value: 'due', label: 'Due' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'mastered', label: 'Mastered' },
]
```

- [ ] **Step 5: Smoke-test utils in Node**

Run:
`node -e "import('./src/utils/urlParser.js').then(m => console.log(JSON.stringify(m.extractTitleAndPlatform('https://leetcode.com/problems/two-sum/'))))"`
Expected: `{"ok":true,"platform":"leetcode","title":"Two Sum"}`

Run:
`node -e "import('./src/utils/urlParser.js').then(m => console.log(JSON.stringify(m.extractTitleAndPlatform('https://www.geeksforgeeks.org/problems/nth-node-from-end-of-linked-list/1'))))"`
Expected: `{"ok":true,"platform":"gfg","title":"Nth Node From End Of Linked List"}`

Run:
`node -e "import('./src/utils/intervalLogic.js').then(m => console.log(m.nextRevisionDate(3,'easy').toString()))"`
Expected: `null` (mastered)

Run:
`node -e "import('./src/utils/intervalLogic.js').then(m => console.log((m.nextRevisionDate(1,'hard').getTime()-Date.now())/86400000))"`
Expected: `~3` (hard keeps current stage of 3 days)

---

### Task 4: Firestore module + data hooks

**Files:**
- Create: `src/firebase/firestore.js`, `src/hooks/useProblems.js`, `src/hooks/useStreak.js`

- [ ] **Step 1: Create `src/firebase/firestore.js`**

```js
import { getFirestore, collection, doc, query, onSnapshot, writeBatch, arrayUnion, setDoc } from 'firebase/firestore'
import { app } from './config.js'
import { TAGS } from '../constants.js'
import { addDays, startOfDay, isWeekend, isYesterday, isToday } from '../utils/dateHelpers.js'
import { nextRevisionDate } from '../utils/intervalLogic.js'

export const db = getFirestore(app)

export function userProblemsCollection(uid) {
  return collection(db, 'users', uid, 'problems')
}

export function userMetaDoc(uid) {
  return doc(db, 'users', uid, 'meta', 'state')
}

export function subscribeProblems(uid, onData, onError) {
  const q = query(userProblemsCollection(uid))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, onError)
}

export function subscribeMeta(uid, onData, onError) {
  return onSnapshot(userMetaDoc(uid), (snap) => {
    onData(snap.exists() ? snap.data() : null)
  }, onError)
}

export async function addProblem(uid, { title, url, platform, tags, difficulty }, meta) {
  const batch = writeBatch(db)
  const ref = doc(userProblemsCollection(uid))
  const now = new Date()
  batch.set(ref, {
    uid,
    title,
    url,
    platform,
    tags,
    difficulty,
    addedAt: now,
    lastRevisedAt: null,
    nextRevisionDate: addDays(startOfDay(now), 1),
    revisionStage: 0,
    confidenceHistory: [],
    isWeekend: false,
  })
const existingCustom = (meta && meta.customTags) || []
  const custom = tags.filter((t) => !TAGS.includes(t))
  if (custom.length > 0) {
    batch.set(userMetaDoc(uid), { customTags: arrayUnion(...custom) }, { merge: true })
  }
  await batch.commit()
  return ref.id
}

export async function markRevised(uid, problemId, problem, rating, meta) {
  const batch = writeBatch(db)
  const now = new Date()

  const updates = {
    lastRevisedAt: now,
    confidenceHistory: arrayUnion({ date: now, rating }),
    isWeekend: isWeekend(now) ? false : true,
  }
  const stage = problem.revisionStage ?? 0
  if (rating !== 'hard') {
    updates.revisionStage = Math.min(stage + 1, 4)
  }
  const next = nextRevisionDate(stage, rating, now)
  updates.nextRevisionDate = next

  batch.update(doc(userProblemsCollection(uid), problemId), updates)

  const streak = computeStreak(meta, now)
  batch.set(userMetaDoc(uid), {
    streak: streak.value,
    lastRevisionDate: now,
    customTags: (meta && meta.customTags) || [],
  }, { merge: true })

  await batch.commit()
  return streak.value
}

function computeStreak(meta, now) {
  if (meta && meta.lastRevisionDate) {
    if (isToday(meta.lastRevisionDate)) return { value: meta.streak ?? 1 }
    if (isYesterday(meta.lastRevisionDate)) return { value: (meta.streak ?? 0) + 1 }
  }
  return { value: 1 }
}

export async function createCustomTag(uid, tag) {
  await setDoc(userMetaDoc(uid), { customTags: arrayUnion(tag) }, { merge: true })
}
```

Note: `nextRevisionDate` may be `null` for mastered problems — the client sorts (Task 10/12), so no composite indexes are needed.

- [ ] **Step 2: Create `src/hooks/useProblems.js`**

```js
import { useEffect, useState } from 'react'
import { subscribeProblems } from '../firebase/firestore.js'

export function useProblems(uid) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return undefined
    const unsub = subscribeProblems(uid, (list) => {
      setProblems(list)
      setLoading(false)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { problems, loading, error }
}
```

- [ ] **Step 3: Create `src/hooks/useStreak.js`**

```js
import { useEffect, useState } from 'react'
import { subscribeMeta } from '../firebase/firestore.js'

export function useStreak(uid) {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return undefined
    const unsub = subscribeMeta(uid, (m) => {
      setMeta(m)
      setLoading(false)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { meta, loading, error }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds with no errors.

---

### Task 5: App shell, routing, ProtectedRoute, Login page

**Files:**
- Create: `src/App.jsx`, `src/components/ProtectedRoute.jsx`, `src/pages/Login.jsx`, `src/main.jsx`
- Modify: `package.json` scripts (optional, skip)

- [ ] **Step 1: Create `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 2: Create `src/components/ProtectedRoute.jsx`**

```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
```

- [ ] **Step 3: Create `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signInWithGoogle } from '../firebase/auth.js'
import { useAuth } from '../hooks/useAuth.js'
import { requestNotificationPermission } from '../hooks/useNotifications.js'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  async function handleSignIn() {
    setBusy(true)
    try {
      await signInWithGoogle()
      requestNotificationPermission()
      toast.success('Signed in with Google')
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      console.error(err)
      toast.error('Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-surface-900 p-8 shadow-2xl">
        <div className="mb-2 text-4xl font-extrabold text-white">
          DSA Revision <span className="text-indigo-400">Reminder</span>
        </div>
        <p className="mb-8 text-sm text-gray-400">
          Fixed spaced repetition for LeetCode, Code360 &amp; GFG problems. Never forget a problem you solved.
        </p>
        <ul className="mb-8 space-y-2 text-sm text-gray-400">
          <li>• Paste a problem URL — title &amp; platform auto-detected</li>
          <li>• Daily revision reminders with confidence tracking</li>
          <li>• Weekend batch + streak stats</li>
        </ul>
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-200 disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.5 35.4 44 30.3 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/App.jsx` with the full route tree**

```jsx
import { Route, Routes, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AllProblems from './pages/AllProblems.jsx'
import AddProblem from './pages/AddProblem.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-8">
                <Dashboard />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/problems"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-8">
                <AllProblems />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950">
              <Navbar />
              <main className="mx-auto max-w-3xl px-4 py-8">
                <AddProblem />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<> <Navigate to="/" replace /> </>} />
    </Routes>
  )
}
```

Note: the `*` catch-all renders `Navigate` wrapped in a fragment — fine for React. (Dashboard/AllProblems/AddProblem pages are created in Tasks 8-12; App imports them eagerly, so keep placeholder exports in those files when they are created, or create the pages before running the dev server.)

---

### Task 6: Navbar + shared badges

**Files:**
- Create: `src/components/Navbar.jsx`, `src/components/Badges.jsx`

- [ ] **Step 1: Create `src/components/Badges.jsx`**

```jsx
export function PlatformBadge({ platform }) {
  const map = {
    leetcode: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    code360: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    gfg: 'bg-green-500/15 text-green-400 border-green-500/30',
  }
  const labels = { leetcode: 'LeetCode', code360: 'Code360', gfg: 'GFG' }
  const fallback = 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[platform] || fallback}`}>
      {labels[platform] || platform}
    </span>
  )
}

export function DifficultyBadge({ difficulty }) {
  const map = {
    easy: 'bg-green-500/15 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[difficulty] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {difficulty}
    </span>
  )
}

export function StagePill({ stage }) {
  const labels = ['New', 'Stage 1', 'Stage 2', 'Stage 3', 'Mastered']
  const styles = [
    'bg-gray-500/15 text-gray-300',
    'bg-indigo-500/15 text-indigo-300',
    'bg-violet-500/15 text-violet-300',
    'bg-purple-500/15 text-purple-300',
    'bg-emerald-500/15 text-emerald-300',
  ]
  const s = Math.min(stage ?? 0, 4)
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${styles[s]}`}>
      {labels[s]}
    </span>
  )
}

export function TagPill({ tag }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
      {tag}
    </span>
  )
}
```

- [ ] **Step 2: Create `src/components/Navbar.jsx`**

```jsx
import { NavLink, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { logOut } from '../firebase/auth.js'
import { useAuth } from '../hooks/useAuth.js'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-indigo-500/15 text-indigo-300' : 'text-gray-400 hover:text-gray-200'}`

export default function Navbar() {
  const { user } = useAuth()

  async function handleLogout() {
    try {
      await logOut()
      toast.success('Signed out')
    } catch (err) {
      console.error(err)
      toast.error('Logout failed')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-surface-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm">🧠</span>
          DSA<span className="text-indigo-400">Revise</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/problems" className={linkClass}>Problems</NavLink>
          <NavLink to="/add" className={linkClass}>+ Add</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <img
                src={user.photoURL}
                alt={user.displayName || 'avatar'}
                className="h-8 w-8 rounded-full border border-gray-700"
                referrerPolicy="no-referrer"
              />
              <span className="hidden text-sm text-gray-300 sm:inline">{user.displayName?.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 transition hover:border-red-500/40 hover:text-red-400"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: both new component files compile with no errors.

---

### Task 7: ConfidenceModal + ProblemCard

**Files:**
- Create: `src/components/ConfidenceModal.jsx`, `src/components/ProblemCard.jsx`

- [ ] **Step 1: Create `src/components/ConfidenceModal.jsx`**

The modal blocks interaction until the user picks Easy / Medium / Hard (fixed overlay + focus trap via `aria-modal`).

```jsx
import { useEffect, useRef } from 'react'
import { PlatformBadge, DifficultyBadge } from './Badges.jsx'

export default function ConfidenceModal({ problem, onSelect, onClose }) {
  const focusRef = useRef(null)

  useEffect(() => {
    focusRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const options = [
    { value: 'easy', label: 'Easy', desc: 'Solved it without hints', cls: 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25' },
    { value: 'medium', label: 'Medium', desc: 'Needed a small hint', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25' },
    { value: 'hard', label: 'Hard', desc: 'Struggled a lot — repeat', cls: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-surface-800 p-6 shadow-2xl transition-transform">
        <h3 className="text-lg font-bold text-white">How did it go?</h3>
        {problem && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-300">
            <span className="font-medium text-indigo-300">{problem.title}</span>
            <PlatformBadge platform={problem.platform} />
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
        )}
        <div className="mt-5 space-y-3">
          {options.map((o) => (
            <button
              key={o.value}
              ref={o.value === 'medium' ? focusRef : null}
              onClick={() => onSelect(o.value)}
              className={`w-full rounded-xl border px-4 py-3 text-left font-semibold transition ${o.cls}`}
            >
              {o.label}
              <span className="block text-xs font-normal opacity-80">{o.desc}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-400 transition hover:text-gray-200"
        >
          Cancel (problem stays due)
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/ProblemCard.jsx`**

Reused by Due Today, Weekend batch, dashboard preview and All Problems. `onRevise` shows the confidence modal from the parent.

```jsx
import { PlatformBadge, DifficultyBadge, StagePill, TagPill } from './Badges.jsx'
import { format } from 'date-fns'

export default function ProblemCard({ problem, showStage = true, showDue = true, onRevise }) {
  const isDue = problem.nextRevisionDate && new Date(problem.nextRevisionDate) <= new Date()
  const isMastered = (problem.revisionStage ?? 0) >= 4

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-surface-900 p-4 transition hover:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-semibold text-gray-100 transition hover:text-indigo-300"
          >
            {problem.title}
          </a>
          <PlatformBadge platform={problem.platform} />
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        {problem.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {problem.tags.map((t) => <TagPill key={t} tag={t} />)}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {showStage && <StagePill stage={problem.revisionStage} />}
{showDue && !isMastered && problem.nextRevisionDate && (
          <span className={`text-xs ${isDue ? 'font-semibold text-amber-400' : 'text-gray-500'}`}>
            Due {format(new Date(problem.nextRevisionDate), 'MMM d')}
          </span>
        )}
        {onRevise && !isMastered && (
          <button
            onClick={onRevise}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isDue
                ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                : 'border border-gray-700 text-gray-300 hover:border-indigo-500/40 hover:text-indigo-300'
            }`}
          >
            Revise Now
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: no compile errors.

---

### Task 8: AddProblem page + AddProblemForm

**Files:**
- Create: `src/components/AddProblemForm.jsx`, `src/pages/AddProblem.jsx`

- [ ] **Step 1: Create `src/components/AddProblemForm.jsx`**

```jsx
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'
import { TAGS, DIFFICULTIES } from '../constants.js'
import { extractTitleAndPlatform } from '../utils/urlParser.js'
import { addProblem, createCustomTag } from '../firebase/firestore.js'
import { PlatformBadge } from './Badges.jsx'

export default function AddProblemForm({ uid, meta }) {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [busy, setBusy] = useState(false)
  const [urlError, setUrlError] = useState('')

  const parsed = useMemo(() => (url.trim() ? extractTitleAndPlatform(url) : null), [url])

  const allTags = useMemo(() => {
    const custom = (meta && meta.customTags) || []
    return [...new Set([...TAGS, ...custom])]
  }, [meta])

  function toggleTag(t) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function addCustomTag() {
    const name = customTag.trim()
    if (!name) return
    if (!allTags.includes(name)) {
      createCustomTag(uid, name).catch((err) => {
        console.error(err)
        toast.error('Could not save custom tag')
      })
    }
    setTags((prev) => (prev.includes(name) ? prev : [...prev, name]))
    setCustomTag('')
  }

  function validateUrl() {
    if (!url.trim()) return 'Paste a problem URL first'
    if (!parsed || !parsed.ok) return 'Unsupported URL — only LeetCode, Code360 and GeeksForGeeks are supported'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validateUrl()
    setUrlError(v)
    if (v) return
    if (tags.length === 0) {
      toast.error('Select at least one tag/pattern')
      return
    }
    if (!difficulty) {
      toast.error('Pick a difficulty')
      return
    }
    setBusy(true)
    try {
      await addProblem(uid, {
        title: parsed.title,
        url: url.trim(),
        platform: parsed.platform,
        tags,
        difficulty,
      }, meta)
      toast.success('Problem added! First revision due tomorrow.')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save problem. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Add a problem</h1>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Problem URL</label>
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
          placeholder="https://leetcode.com/problems/two-sum/"
          className="w-full rounded-xl border border-gray-700 bg-surface-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-indigo-500"
        />
        {parsed?.ok && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <PlatformBadge platform={parsed.platform} />
            <span className="text-gray-300">{parsed.title}</span>
          </div>
        )}
        {urlError && <p className="mt-2 text-sm text-red-400">{urlError}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Pattern / Tags</label>
        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-gray-700 bg-surface-800 p-3">
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                tags.includes(t)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Custom tag (e.g. Kadane, Grid, XOR)"
            className="flex-1 rounded-xl border border-gray-700 bg-surface-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-xl border border-indigo-500/40 px-3 py-2 text-sm text-indigo-300 transition hover:bg-indigo-500/10"
          >
            Add tag
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                difficulty === d
                  ? d === 'easy'
                    ? 'border-green-500 bg-green-500/15 text-green-400'
                    : d === 'medium'
                      ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                      : 'border-red-500 bg-red-500/15 text-red-400'
                  : 'border-gray-700 bg-surface-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save problem'}
        </button>
        <Link to="/" className="text-sm text-gray-400 transition hover:text-gray-200">Cancel</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/pages/AddProblem.jsx`**

```jsx
import { useAuth } from '../hooks/useAuth.js'
import { useStreak } from '../hooks/useStreak.js'
import AddProblemForm from '../components/AddProblemForm.jsx'

export default function AddProblem() {
  const { user } = useAuth()
  const { meta } = useStreak(user?.uid)

  if (!user) return null
  return <AddProblemForm uid={user.uid} meta={meta} />
}
```

- [ ] **Step 3: Verify page renders**

Run: `npm run dev`, open `/add` while signed in.
Expected: form renders with tag chips, difficulty buttons, and empty live-preview until a URL is pasted.

---

### Task 9: Dashboard — Due Today, Upcoming, Weekend sections

**Files:**
- Create: `src/pages/Dashboard.jsx`
- Note: StatsBar/WeeklyChart are embedded in Dashboard in Task 10; final assembly reuses this file.

- [ ] **Step 1: Create the Dashboard sections**

```jsx
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useProblems } from '../hooks/useProblems.js'
import { useStreak } from '../hooks/useStreak.js'
import { markRevised } from '../firebase/firestore.js'
import ProblemCard from '../components/ProblemCard.jsx'
import ConfidenceModal from '../components/ConfidenceModal.jsx'
import StatsBar from '../components/StatsBar.jsx'
import WeeklyChart from '../components/WeeklyChart.jsx'
import { daysUntil, startOfDay, isToday } from '../utils/dateHelpers.js'

export default function Dashboard() {
  const { user } = useAuth()
  const { problems, loading, error } = useProblems(user?.uid)
  const { meta } = useStreak(user?.uid)
  const [activeProblem, setActiveProblem] = useState(null)

  const dueToday = useMemo(() => {
    const today = startOfDay(new Date())
    return problems
      .filter((p) => p.nextRevisionDate && new Date(p.nextRevisionDate) <= today && (p.revisionStage ?? 0) < 4)
      .sort((a, b) => new Date(a.nextRevisionDate) - new Date(b.nextRevisionDate))
  }, [problems])

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    return problems
      .filter((p) => {
        if (!p.nextRevisionDate || (p.revisionStage ?? 0) >= 4) return false
        const d = daysUntil(p.nextRevisionDate)
        return d >= 1 && d <= 7
      })
      .sort((a, b) => new Date(a.nextRevisionDate) - new Date(b.nextRevisionDate))
  }, [problems])

  const weekendBatch = useMemo(
    () => problems.filter((p) => p.isWeekend && (p.revisionStage ?? 0) < 4),
    [problems],
  )

  const recentProblems = useMemo(
    () => [...problems].sort((a, b) => new Date(b.nextRevisionDate ?? 0) - new Date(a.nextRevisionDate ?? 0)).slice(0, 5),
    [problems],
  )

  const revisedToday = useMemo(
    () => problems.reduce((n, p) => n + (p.confidenceHistory || []).filter((c) => isToday(c.date)).length, 0),
    [problems],
  )

  const masteredCount = useMemo(
    () => problems.filter((p) => (p.revisionStage ?? 0) >= 4).length,
    [problems],
  )

  async function handleRevise(rating, problem) {
    setActiveProblem(null)
    try {
      await markRevised(user.uid, problem.id, problem, rating, meta)
      toast.success(problem.title + (rating === 'hard' ? ' — repeat interval' : ' — stage advanced'))
    } catch (err) {
      console.error(err)
      toast.error('Failed to record revision')
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading…</div>
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        Failed to load data: {error}. Check Firestore rules and your connection.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <StatsBar streak={meta?.streak || 0} total={problems.length} revisedToday={revisedToday} mastered={masteredCount} />
      <WeeklyChart problems={problems} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Due Today <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-sm font-semibold text-amber-400">{dueToday.length}</span>
          </h2>
        </div>
        {dueToday.length === 0 ? (
          <p className="rounded-xl border border-gray-800 bg-surface-900 p-4 text-sm text-gray-400">
            Nothing due today. Add a problem or enjoy the free time. 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {dueToday.map((p) => (
              <ProblemCard key={p.id} problem={p} onRevise={() => setActiveProblem(p)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upcoming Revisions</h2>
          <span className="text-sm text-gray-500">Next 7 days</span>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-gray-800 bg-surface-900 p-4 text-sm text-gray-400">Nothing scheduled in the next week.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((p) => (
              <ProblemCard key={p.id} problem={p} onRevise={() => setActiveProblem(p)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Weekend Revision</h2>
          <span className="text-sm text-gray-500">{weekendBatch.length} {weekendBatch.length === 1 ? 'problem' : 'problems'} to revise this weekend</span>
        </div>
        {weekendBatch.length === 0 ? (
          <p className="rounded-xl border border-gray-800 bg-surface-900 p-4 text-sm text-gray-400">
            Problems you revise on weekdays queue up here for a weekend deep-dive.
          </p>
        ) : (
          <div className="space-y-2">
            {weekendBatch.map((p) => (
              <ProblemCard key={p.id} problem={p} onRevise={() => setActiveProblem(p)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">All Problems</h2>
          <Link to="/problems" className="text-sm text-indigo-400 transition hover:text-indigo-300">View all →</Link>
        </div>
        <div className="space-y-2">
          {recentProblems.map((p) => (
            <ProblemCard key={p.id} problem={p} onRevise={() => setActiveProblem(p)} />
          ))}
        </div>
      </section>

      {activeProblem && (
        <ConfidenceModal
          problem={activeProblem}
          onClose={() => setActiveProblem(null)}
          onSelect={(rating) => handleRevise(rating, activeProblem)}
        />
      )}
    </div>
  )
}
```

Note: `handleRevise` uses the captured `problem` from `activeProblem`; the `onRevise` handler on ProblemCard passes only the click — ProblemCard already closes over its own problem.

---

### Task 10: StatsBar + WeeklyChart

**Files:**
- Create: `src/components/StatsBar.jsx`, `src/components/WeeklyChart.jsx`
- Modify: none (Dashboard already imports both)

- [ ] **Step 1: Create `src/components/StatsBar.jsx`**

```jsx
function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-surface-900 p-4">
      <div className={`text-2xl font-extrabold ${accent}`}>{value}</div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  )
}

export default function StatsBar({ streak, total, revisedToday, mastered }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Day streak" value={`${streak}🔥`} accent="text-orange-400" />
      <Stat label="Total problems" value={total} accent="text-indigo-400" />
      <Stat label="Revised today" value={revisedToday} accent="text-emerald-400" />
      <Stat label="Mastered" value={mastered} accent="text-purple-400" />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/WeeklyChart.jsx`**

Bar chart of revisions per day (Mon–Sun) using `confidenceHistory` dates.

```jsx
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { startOfWeek, addDays } from 'date-fns'

export default function WeeklyChart({ problems }) {
  const [expanded, setExpanded] = useState(false)

  const data = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(base, i)
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        count: 0,
        isToday: d.toDateString() === new Date().toDateString(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      }
    })
    const dayIndex = (date) => Math.floor((new Date(date).setHours(0, 0, 0, 0) - base.setHours(0, 0, 0, 0)) / 86400000)
    for (const p of problems) {
      for (const c of p.confidenceHistory || []) {
        const idx = dayIndex(c.date)
        if (idx >= 0 && idx < 7) days[idx].count += 1
      }
    }
    return days
  }, [problems])

  return (
    <div className="rounded-xl border border-gray-800 bg-surface-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">This week's revisions</h2>
        <button onClick={() => setExpanded((v) => !v)} className="text-xs text-indigo-400 transition hover:text-indigo-300">
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div style={{ height: expanded ? 240 : 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
              labelStyle={{ color: '#e5e7eb' }}
              formatter={(v) => [v, 'revisions']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.isToday ? '#818cf8' : d.isWeekend ? '#4f46e5' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify dev server renders the dashboard**

Run: `npm run dev`
Expected: chart shows with 7 buckets; today highlighted with a lighter indigo.

---

### Task 11: All Problems page (filters, sort, table/cards)

**Files:**
- Create: `src/pages/AllProblems.jsx`

- [ ] **Step 1: Create `src/pages/AllProblems.jsx`**

Client-side filtering + sorting (small dataset, no composite indexes needed).

```jsx
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth.js'
import { useProblems } from '../hooks/useProblems.js'
import { useStreak } from '../hooks/useStreak.js'
import { markRevised } from '../firebase/firestore.js'
import ConfidenceModal from '../components/ConfidenceModal.jsx'
import { PlatformBadge, DifficultyBadge, StagePill, TagPill } from '../components/Badges.jsx'
import { TAGS, DIFFICULTIES, STATUS_OPTIONS } from '../constants.js'
import { daysUntil } from '../utils/dateHelpers.js'
import toast from 'react-hot-toast'

const SORTS = [
  { value: 'nextRevision', label: 'Next revision date' },
  { value: 'added', label: 'Date added' },
  { value: 'difficulty', label: 'Difficulty' },
]

const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 }

export default function AllProblems() {
  const { user } = useAuth()
  const { problems, loading, error } = useProblems(user?.uid)
  const { meta } = useStreak(user?.uid)
  const [platform, setPlatform] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [tag, setTag] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('nextRevision')
  const [activeProblem, setActiveProblem] = useState(null)

  const filtered = useMemo(() => {
    let list = [...problems]
    if (platform !== 'all') list = list.filter((p) => p.platform === platform)
    if (difficulty !== 'all') list = list.filter((p) => p.difficulty === difficulty)
    if (tag !== 'all') list = list.filter((p) => p.tags?.includes(tag))
    if (status === 'due') list = list.filter((p) => p.nextRevisionDate && new Date(p.nextRevisionDate) <= new Date() && (p.revisionStage ?? 0) < 4)
    if (status === 'upcoming') list = list.filter((p) => p.nextRevisionDate && new Date(p.nextRevisionDate) > new Date() && (p.revisionStage ?? 0) < 4)
    if (status === 'mastered') list = list.filter((p) => (p.revisionStage ?? 0) >= 4)

    const cmp = {
      nextRevision: (a, b) => new Date(a.nextRevisionDate ?? 0) - new Date(b.nextRevisionDate ?? 0),
      added: (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
      difficulty: (a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty],
    }[sort]
    return list.sort(cmp)
  }, [problems, platform, difficulty, tag, status, sort])

  async function handleRevise(rating, problem) {
    setActiveProblem(null)
    try {
      await markRevised(user.uid, problem.id, problem, rating, meta)
      toast.success('Revision recorded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to record revision')
    }
  }

  const selectClass = 'rounded-xl border border-gray-700 bg-surface-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">All Problems <span className="text-base font-normal text-gray-500">({filtered.length})</span></h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
          <option value="all">All platforms</option>
          <option value="leetcode">LeetCode</option>
          <option value="code360">Code360</option>
          <option value="gfg">GFG</option>
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectClass}>
          <option value="all">All tags</option>
          {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="all">Any status</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">Loading…</p>
      ) : error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-gray-800 bg-surface-900 p-6 text-center text-sm text-gray-400">No problems match. Add one →</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-800 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-800 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Problem</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Next revision</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-surface-900">
                {filtered.map((p) => {
                  const isDue = p.nextRevisionDate && new Date(p.nextRevisionDate) <= new Date()
                  const mastered = (p.revisionStage ?? 0) >= 4
                  return (
                    <tr key={p.id} className="transition hover:bg-surface-800/60">
                      <td className="max-w-[280px] px-4 py-3">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-gray-100 transition hover:text-indigo-300">{p.title}</a>
                        {p.tags?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{p.tags.slice(0, 3).map((t) => <TagPill key={t} tag={t} />)}</div>}
                      </td>
                      <td className="px-4 py-3"><PlatformBadge platform={p.platform} /></td>
                      <td className="px-4 py-3"><DifficultyBadge difficulty={p.difficulty} /></td>
                      <td className="px-4 py-3"><StagePill stage={p.revisionStage} /></td>
                      <td className="px-4 py-3">
                        {mastered ? <span className="text-xs text-emerald-400">—</span> : (
                          `${format(new Date(p.nextRevisionDate), 'MMM d')} ${isDue ? '· due' : p.nextRevisionDate ? `· ${daysUntil(p.nextRevisionDate)}d` : ''}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!mastered && (
                          <button
                            onClick={() => setActiveProblem(p)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${isDue ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' : 'border border-gray-700 text-gray-300 hover:border-indigo-500/40 hover:text-indigo-300'}`}
                          >
                            Revise
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-800 bg-surface-900 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-100 hover:text-indigo-300">{p.title}</a>
                  <PlatformBadge platform={p.platform} />
                  <DifficultyBadge difficulty={p.difficulty} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StagePill stage={p.revisionStage} />
                  {!((p.revisionStage ?? 0) >= 4) && (
                    <button
                      onClick={() => setActiveProblem(p)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${new Date(p.nextRevisionDate) <= new Date() ? 'bg-amber-500/15 text-amber-400' : 'border border-gray-700 text-gray-300'}`}
                    >
                      Revise
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeProblem && (
        <ConfidenceModal
          problem={activeProblem}
          onClose={() => setActiveProblem(null)}
          onSelect={(rating) => handleRevise(rating, activeProblem)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify filters/sort work**

Run: `npm run dev`, open `/problems`.
Expected: table on desktop, cards on mobile; each filter narrows the result; sort changes order.

---

### Task 12: Notifications — service worker + daily reminder hook

**Files:**
- Create: `public/sw.js`, `src/hooks/useNotifications.js`
- Modify: `src/hooks/useAuth.js` (no), `src/main.jsx` (no) — wire `useDailyReminder` inside `ProtectedRoute` via a new `AppNotifications` component.

- [ ] **Step 1: Create `public/sw.js`**

```js
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus()
          client.navigate('/')
          return
        }
      }
      return clients.openWindow('/')
    }),
  )
})
```

- [ ] **Step 2: Create `src/hooks/useNotifications.js`**

```js
import { useEffect } from 'react'

const REMINDER_HOUR = 9

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (err) {
    console.warn('SW registration failed', err)
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await registerServiceWorker()
}

function msUntilNextReminder(now = new Date()) {
  const next = new Date(now)
  next.setHours(REMINDER_HOUR, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

export function useDailyReminder({ isAuthed, dueCount }) {
  useEffect(() => {
    if (!isAuthed) return undefined
    if (!('Notification' in window) || Notification.permission !== 'granted') return undefined

    let timer
    const arm = () => {
      timer = setTimeout(() => {
        if (dueCount() > 0) {
          new Notification('DSA Revision Reminder', {
            body: `${dueCount()} ${dueCount() === 1 ? 'problem is' : 'problems are'} due today. Revise now!`,
            tag: 'dsa-due-today',
          })
        }
        arm()
      }, msUntilNextReminder())
    }
    arm()
    return () => clearTimeout(timer)
  }, [isAuthed])
}
```

- [ ] **Step 3: Create `src/components/AppNotifications.jsx`**

```jsx
import { useRef } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useProblems } from '../hooks/useProblems.js'
import { useDailyReminder } from '../hooks/useNotifications.js'

export default function AppNotifications() {
  const { user } = useAuth()
  const { problems } = useProblems(user?.uid)
  const dueRef = useRef(0)
  dueRef.current = problems.filter((p) => p.nextRevisionDate && new Date(p.nextRevisionDate) <= new Date() && (p.revisionStage ?? 0) < 4).length

  useDailyReminder({
    isAuthed: Boolean(user),
    dueCount: () => dueRef.current,
  })

  return null
}
```

- [ ] **Step 4: Wire `AppNotifications` into the protected layout (edit `src/App.jsx`)**

Inside the `ProtectedRoute` wrapper for `/`, add `<AppNotifications />` above `<Navbar />` and update the import line:

```jsx
import AppNotifications from './components/AppNotifications.jsx'
```

```jsx
<ProtectedRoute>
  <div className="min-h-screen bg-gray-950">
    <AppNotifications />
    <Navbar />
    ...
```

- [ ] **Step 5: First-login permission prompt**

Already wired in `Login.jsx` (Task 5): `requestNotificationPermission()` is called right after a successful Google sign-in — user gesture context preserved.

- [ ] **Step 6: Verify notification flow**

Run: `npm run dev` on localhost (or HTTPS host). Sign in, allow notifications, and temporarily change `REMINDER_HOUR` in `useNotifications.js` to 1 minute ahead of `now` — after granting, a "Due Today" notification should appear when problems are due.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build succeeds; `dist/sw.js` exists.

---

### Task 13: Firestore security rules + indexes + README

**Files:**
- Create: `firestore.rules`, `firestore.indexes.json`, `README.md`

- [ ] **Step 1: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Note: meta lives at `users/{uid}/meta/state` and problems at `users/{uid}/problems/{id}` — both covered by the recursive wildcard above.

- [ ] **Step 2: Create `firestore.indexes.json`**

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

No composite indexes required — all filtering and sorting happens client-side after a single unscoped `onSnapshot` per user. (If Firestore ever complains in the console about a query, add the suggested index here.)

- [ ] **Step 3: Create `README.md`**

```markdown
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
```

- [ ] **Step 4: Final full verification**

Run: `npm run build`
Expected: clean build with no warnings/errors.

Run: `npm run dev`, sign in, add a LeetCode + GFG + Code360 URL, mark revisions with all three ratings, verify:
1. Due Today badge count matches; Revise Now opens the modal; modal blocks background interaction.
2. Hard keeps the same stage; Easy advances; stage 4 shows Mastered.
3. Weekend batch picks up weekday revisions; weekend revisions clear the flag.
4. Streak increments on consecutive days (verify via meta document in Firestore console).
5. All Problems filters (platform/difficulty/tag/status) + sorts work; title links open the problem.
6. Weekly chart counts match `confidenceHistory` entries for the current week.

---

## Self-review notes (already applied)

- No composite indexes needed: single unscoped query + client-side filter/sort (avoids per-combo index failures).
- Mastered problems: `nextRevisionDate: null` is stored and handled everywhere with `(p.revisionStage ?? 0) >= 4` guards.
- `AddProblemForm` saves custom tags to meta via `createCustomTag`; `addProblem` merges them in the same batch.
- Notifications are client-only by design decision (user approved; no FCM).
