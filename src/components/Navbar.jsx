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