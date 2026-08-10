import { useRef } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useProblems } from '../hooks/useProblems.js'
import { useDailyReminder } from '../hooks/useNotifications.js'

export default function AppNotifications() {
  const { user } = useAuth()
  const { problems } = useProblems(user?.uid)
  const dueRef = useRef(0)
  dueRef.current = problems.filter((p) => p.nextRevisionDate && new Date(p.nextRevisionDate) <= new Date() && (p.revisionStage ?? 0) < 4).length

  useDailyReminder({
    isAuthed: Boolean(user),
    dueCount: () => dueRef.current,
  })

  return null
}