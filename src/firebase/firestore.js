import { getFirestore, collection, doc, query, onSnapshot, writeBatch, arrayUnion, setDoc, Timestamp } from 'firebase/firestore'
import { app, firebaseReady } from './config.js'
import { TAGS } from '../constants.js'
import { addDays, startOfDay, isWeekend, isYesterday, isToday } from '../utils/dateHelpers.js'
import { nextRevisionDate } from '../utils/intervalLogic.js'

export const db = app ? getFirestore(app) : null

export function convertDates(value) {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(convertDates)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = convertDates(v)
    return out
  }
  return value
}

export function userProblemsCollection(uid) {
  return collection(db, 'users', uid, 'problems')
}

export function userMetaDoc(uid) {
  return doc(db, 'users', uid, 'meta', 'state')
}

export function subscribeProblems(uid, onData, onError) {
  if (!db) {
    onError?.('Firebase is not configured')
    return () => {}
  }
  const q = query(userProblemsCollection(uid))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...convertDates(d.data()) })))
  }, onError)
}

export function subscribeMeta(uid, onData, onError) {
  if (!db) {
    onError?.('Firebase is not configured')
    return () => {}
  }
  return onSnapshot(userMetaDoc(uid), (snap) => {
    onData(snap.exists() ? convertDates(snap.data()) : null)
  }, onError)
}

export async function addProblem(uid, { title, url, platform, tags, difficulty }, meta) {
  const batch = writeBatch(db)
  const ref = doc(userProblemsCollection(uid))
  const now = new Date()
  batch.set(ref, {
    uid,
    title,
    url,
    platform,
    tags,
    difficulty,
    addedAt: now,
    lastRevisedAt: null,
    nextRevisionDate: addDays(startOfDay(now), 1),
    revisionStage: 0,
    confidenceHistory: [],
    isWeekend: false,
  })
  const custom = tags.filter((t) => !TAGS.includes(t))
  if (custom.length > 0) {
    batch.set(userMetaDoc(uid), { customTags: arrayUnion(...custom) }, { merge: true })
  }
  await batch.commit()
  return ref.id
}

export async function markRevised(uid, problemId, problem, rating, meta) {
  const batch = writeBatch(db)
  const now = new Date()

  const updates = {
    lastRevisedAt: now,
    confidenceHistory: arrayUnion({ date: now, rating }),
    isWeekend: isWeekend(now) ? false : true,
  }
  const stage = problem.revisionStage ?? 0
  if (rating !== 'hard') {
    updates.revisionStage = Math.min(stage + 1, 4)
  }
  updates.nextRevisionDate = nextRevisionDate(stage, rating, now)

  batch.update(doc(userProblemsCollection(uid), problemId), updates)

  const streak = computeStreak(meta, now)
  batch.set(userMetaDoc(uid), {
    streak: streak.value,
    lastRevisionDate: now,
    customTags: (meta && meta.customTags) || [],
  }, { merge: true })

  await batch.commit()
  return streak.value
}

function computeStreak(meta, now) {
  if (meta && meta.lastRevisionDate) {
    if (isToday(meta.lastRevisionDate)) return { value: meta.streak ?? 1 }
    if (isYesterday(meta.lastRevisionDate)) return { value: (meta.streak ?? 0) + 1 }
  }
  return { value: 1 }
}

export async function createCustomTag(uid, tag) {
  if (!firebaseReady) return
  await setDoc(userMetaDoc(uid), { customTags: arrayUnion(tag) }, { merge: true })
}