import { useEffect, useState } from 'react'
import { subscribeProblems } from '../firebase/firestore.js'

export function useProblems(uid) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return undefined
    const unsub = subscribeProblems(uid, (list) => {
      setProblems(list)
      setLoading(false)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { problems, loading, error }
}