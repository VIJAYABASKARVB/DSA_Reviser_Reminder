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