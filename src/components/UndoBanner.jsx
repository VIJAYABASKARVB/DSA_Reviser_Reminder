import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth.js'
import { undoRevision } from '../firebase/firestore.js'

export default function UndoBanner({ meta }) {
  const { user } = useAuth()
  const last = meta?.lastRevision
  if (!last) return null

  async function handleUndo() {
    try {
      await undoRevision(user.uid, last.problemId)
      toast.success('Revision undone')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm">
      <span className="text-indigo-200">
        Last revision: <span className="font-semibold text-white">{last.title}</span> — marked by accident?
      </span>
      <button
        onClick={handleUndo}
        className="rounded-lg border border-indigo-500/40 px-3 py-1.5 font-medium text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-200"
      >
        ↩ Undo revision
      </button>
    </div>
  )
}
