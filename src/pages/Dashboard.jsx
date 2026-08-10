import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useProblems } from '../hooks/useProblems.js'
import { useStreak } from '../hooks/useStreak.js'
import { markRevised, undoRevision } from '../firebase/firestore.js'
import ProblemCard from '../components/ProblemCard.jsx'
import ConfidenceModal from '../components/ConfidenceModal.jsx'
import StatsBar from '../components/StatsBar.jsx'
import WeeklyChart from '../components/WeeklyChart.jsx'
import UndoBanner from '../components/UndoBanner.jsx'
import { daysUntil, startOfDay, isToday, toSafeDate } from '../utils/dateHelpers.js'

const SORTS = [
  { value: 'addedAsc', label: 'Oldest added' },
  { value: 'addedDesc', label: 'Newest added' },
  { value: 'nextRevision', label: 'Next revision date' },
  { value: 'difficulty', label: 'Difficulty' },
]

const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 }

export default function Dashboard() {
  const { user } = useAuth()
  const { problems, loading, error } = useProblems(user?.uid)
  const { meta } = useStreak(user?.uid)
  const [activeProblem, setActiveProblem] = useState(null)
  const [sort, setSort] = useState('addedAsc')

  const sortCmp = {
    addedAsc: (a, b) => (toSafeDate(a.addedAt) ?? 0) - (toSafeDate(b.addedAt) ?? 0),
    addedDesc: (a, b) => (toSafeDate(b.addedAt) ?? 0) - (toSafeDate(a.addedAt) ?? 0),
    nextRevision: (a, b) => new Date(a.nextRevisionDate ?? 0) - new Date(b.nextRevisionDate ?? 0),
    difficulty: (a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty],
  }[sort]

  const dueToday = useMemo(() => {
    const today = startOfDay(new Date())
    return problems
      .filter((p) => p.nextRevisionDate && new Date(p.nextRevisionDate) <= today && (p.revisionStage ?? 0) < 4)
      .sort(sortCmp)
  }, [problems, sort])

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    return problems
      .filter((p) => {
        if (!p.nextRevisionDate || (p.revisionStage ?? 0) >= 4) return false
        const d = daysUntil(p.nextRevisionDate)
        return d >= 1 && d <= 7
      })
      .sort(sortCmp)
  }, [problems, sort])

  const weekendBatch = useMemo(
    () => problems.filter((p) => p.isWeekend && (p.revisionStage ?? 0) < 4).sort(sortCmp),
    [problems, sort],
  )

  const recentProblems = useMemo(
    () => [...problems].sort(sortCmp).slice(0, 5),
    [problems, sort],
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
      toast.success('Revision recorded', {
        duration: 10000,
        action: {
          label: '↩ Undo',
          onClick: async () => {
            try {
              await undoRevision(user.uid, problem.id)
              toast.success('Revision undone')
            } catch (err) {
              toast.error(err.message)
            }
          },
        },
      })
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
      <UndoBanner meta={meta} />
      <div className="flex justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-gray-700 bg-surface-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
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