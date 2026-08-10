import { useEffect, useState } from 'react'
import { subscribeMeta } from '../firebase/firestore.js'

export function useStreak(uid) {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return undefined
    const unsub = subscribeMeta(uid, (m) => {
      setMeta(m)
      setLoading(false)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { meta, loading, error }
}