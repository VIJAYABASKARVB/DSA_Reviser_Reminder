export const STAGE_DAYS = [1, 3, 7, 30]
export const MASTERED_STAGE = 4
export const STAGE_LABELS = ['New', 'Stage 1', 'Stage 2', 'Stage 3', 'Mastered']

export function nextStage(currentStage, rating) {
  if (rating === 'hard') return currentStage
  return Math.min(currentStage + 1, MASTERED_STAGE)
}

export function nextRevisionDate(currentStage, rating, fromDate = new Date()) {
  const stage = nextStage(currentStage, rating)
  if (stage >= MASTERED_STAGE) return null
  const next = new Date(fromDate)
  next.setDate(next.getDate() + STAGE_DAYS[stage])
  return next
}