import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { app } from './config.js'

export const auth = app ? getAuth(app) : null
const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase is not configured')
  return signInWithPopup(auth, googleProvider)
}

export async function logOut() {
  if (!auth) return
  return signOut(auth)
}