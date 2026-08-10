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