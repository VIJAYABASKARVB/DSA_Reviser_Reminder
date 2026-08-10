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