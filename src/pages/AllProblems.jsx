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
  console.log('📋 AllProblems rendering...')
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