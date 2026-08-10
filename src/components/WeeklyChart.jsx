import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { startOfWeek, addDays } from 'date-fns'

export default function WeeklyChart({ problems }) {
  const [expanded, setExpanded] = useState(false)

  const data = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const base = startOfWeek(new Date(), { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(base, i)
      return {
        day: labels[i],
        count: 0,
        isToday: d.toDateString() === new Date().toDateString(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      }
    })
    const dayIndex = (date) => {
      const t = new Date(date)
      const start = new Date(base)
      start.setHours(0, 0, 0, 0)
      const end = new Date(t)
      end.setHours(0, 0, 0, 0)
      return Math.floor((end.getTime() - start.getTime()) / 86400000)
    }
    for (const p of problems) {
      console.log('📈 WeeklyChart problem:', p.id, 'confidenceHistory:', p.confidenceHistory)
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