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