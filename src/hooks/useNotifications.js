import { useEffect } from 'react'

const REMINDER_HOUR = 9

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (err) {
    console.warn('SW registration failed', err)
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await registerServiceWorker()
}

function msUntilNextReminder(now = new Date()) {
  const next = new Date(now)
  next.setHours(REMINDER_HOUR, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

export function useDailyReminder({ isAuthed, dueCount }) {
  useEffect(() => {
    if (!isAuthed) return undefined
    if (!('Notification' in window) || Notification.permission !== 'granted') return undefined

    let timer
    const arm = () => {
      timer = setTimeout(() => {
        if (dueCount() > 0) {
          new Notification('DSA Revision Reminder', {
            body: `${dueCount()} ${dueCount() === 1 ? 'problem is' : 'problems are'} due today. Revise now!`,
            tag: 'dsa-due-today',
          })
        }
        arm()
      }, msUntilNextReminder())
    }
    arm()
    return () => clearTimeout(timer)
  }, [isAuthed])
}