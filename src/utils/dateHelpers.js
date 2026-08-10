import { isSameDay } from 'date-fns'

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const isToday = (d) => isSameDay(new Date(d), new Date())

export function isWeekend(d = new Date()) {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function daysUntil(date) {
  const a = startOfDay(new Date())
  const b = startOfDay(new Date(date))
  return Math.round((b - a) / 86400000)
}

export function isYesterday(d) {
  return isSameDay(new Date(d), addDays(new Date(), -1))
}