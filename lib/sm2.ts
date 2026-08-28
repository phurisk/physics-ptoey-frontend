// Classic SuperMemo SM-2 spaced-repetition algorithm. Pure functions, no DB
// access — the review API route calls applyReview() with the previous
// FlashcardReview state (or null) and a 0-5 grade, and persists whatever it
// returns.

const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5

export type SM2State = { repetitions: number; easeFactor: number; interval: number }

export function sm2(state: SM2State, grade: number): SM2State {
  let { repetitions, easeFactor, interval } = state

  if (grade >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  if (easeFactor < MIN_EASE_FACTOR) easeFactor = MIN_EASE_FACTOR

  return { repetitions, easeFactor, interval }
}

export function initialState(): SM2State {
  return { repetitions: 0, easeFactor: DEFAULT_EASE_FACTOR, interval: 0 }
}

export function deriveStatus({ repetitions, interval, lapses }: { repetitions: number; interval: number; lapses: number }) {
  if (repetitions === 0 && lapses === 0) return "NEW" as const
  if (lapses > 0 && repetitions < 2) return "RELEARNING" as const
  if (interval < 21) return "LEARNING" as const
  return "REVIEW" as const
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

type PrevReview = { repetitions: number; easeFactor: number; interval: number; lapses: number } | null

export function applyReview(prev: PrevReview, grade: number, now: Date = new Date()) {
  const base: SM2State = prev ?? initialState()
  const next = sm2(base, grade)
  const lapses = (prev?.lapses ?? 0) + (grade < 3 ? 1 : 0)

  return {
    repetitions: next.repetitions,
    easeFactor: next.easeFactor,
    interval: next.interval,
    lapses,
    status: deriveStatus({ repetitions: next.repetitions, interval: next.interval, lapses }),
    lastReviewedAt: now,
    nextReviewAt: addDays(now, next.interval),
  }
}
