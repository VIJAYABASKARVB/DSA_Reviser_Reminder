import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signInWithGoogle } from '../firebase/auth.js'
import { useAuth } from '../hooks/useAuth.js'
import { requestNotificationPermission } from '../hooks/useNotifications.js'
import { firebaseReady } from '../firebase/config.js'

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
        {!firebaseReady ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            Firebase is not configured yet. Copy <code className="rounded bg-gray-800 px-1">.env.example</code> to <code className="rounded bg-gray-800 px-1">.env</code>, fill in your
            Firebase web-app keys, then restart the dev server. See README.md for the full setup guide.
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}