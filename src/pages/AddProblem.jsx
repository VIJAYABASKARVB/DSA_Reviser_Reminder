import { useAuth } from '../hooks/useAuth.js'
import { useStreak } from '../hooks/useStreak.js'
import AddProblemForm from '../components/AddProblemForm.jsx'

export default function AddProblem() {
  const { user } = useAuth()
  const { meta } = useStreak(user?.uid)

  if (!user) return null
  return <AddProblemForm uid={user.uid} meta={meta} />
}