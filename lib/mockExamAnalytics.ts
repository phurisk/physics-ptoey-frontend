// Analytics helpers for the Mock Exam admin page and student result page —
// percentile ranking (score/time/efficiency), per-question dwell time
// (derived from sequential MockStudentAnswer.answeredAt timestamps, since
// there's no dedicated per-question timer), classic item analysis
// (difficulty/discrimination), and "how many other students picked the same
// wrong option as you" mistake-pattern stats. All derived from existing
// data — no schema changes needed.
import { prisma } from "@/lib/prisma"

const MIN_ATTEMPTS_FOR_PERCENTILE = 3 // below this, percentiles are too noisy to show

// Percentile-rank formula: % of the OTHER attempts you did at least as well as.
function percentileRank(values: number[], mine: number, higherIsBetter = true) {
  const others = values.filter((v) => v !== mine)
  if (others.length === 0) return null
  const better = others.filter((v) => (higherIsBetter ? v <= mine : v >= mine)).length
  return Math.round((better / others.length) * 100)
}

export async function getScoreTimeComparison(mockExamId: string, myAttemptId: string) {
  const attempts = await prisma.mockExamAttempt.findMany({
    where: { mockExamId, mode: "REAL", status: "COMPLETED" },
    select: { id: true, percentage: true, startedAt: true, completedAt: true },
  })

  if (attempts.length < MIN_ATTEMPTS_FOR_PERCENTILE) {
    return { available: false as const, totalAttempts: attempts.length }
  }

  const withDuration = attempts.map((a) => ({
    ...a,
    durationSec: Math.max(1, (new Date(a.completedAt!).getTime() - new Date(a.startedAt).getTime()) / 1000),
  }))

  const mine = withDuration.find((a) => a.id === myAttemptId)
  if (!mine) return { available: false as const, totalAttempts: attempts.length }

  const myEfficiency = mine.percentage / (mine.durationSec / 60)

  const scorePercentile = percentileRank(withDuration.map((a) => a.percentage), mine.percentage, true)
  // Faster = better, so "better than X%" means X% took *longer* than you.
  const timePercentile = percentileRank(withDuration.map((a) => a.durationSec), mine.durationSec, false)
  const efficiencyValues = withDuration.map((a) => a.percentage / (a.durationSec / 60))
  const efficiencyPercentile = percentileRank(efficiencyValues, myEfficiency, true)

  return {
    available: true as const,
    totalAttempts: attempts.length,
    myDurationSec: Math.round(mine.durationSec),
    avgDurationSec: Math.round(withDuration.reduce((s, a) => s + a.durationSec, 0) / withDuration.length),
    scorePercentile,
    timePercentile,
    efficiencyPercentile,
  }
}

export async function getQuestionTimings(mockExamId: string, myAttemptId: string) {
  const questions = await prisma.mockQuestion.findMany({
    where: { mockExamId },
    select: { id: true, order: true },
    orderBy: { order: "asc" },
  })
  const orderByQuestionId = new Map(questions.map((q) => [q.id, q.order]))

  const attempts = await prisma.mockExamAttempt.findMany({
    where: { mockExamId, status: "COMPLETED" },
    select: {
      id: true,
      startedAt: true,
      answers: { select: { questionId: true, answeredAt: true } },
    },
  })

  const sumByQuestion = new Map<string, { sum: number; count: number }>()
  const myDwellByQuestion = new Map<string, number>()

  for (const attempt of attempts) {
    const ordered = attempt.answers
      .filter((a) => orderByQuestionId.has(a.questionId))
      .sort((a, b) => orderByQuestionId.get(a.questionId)! - orderByQuestionId.get(b.questionId)!)

    let prevTime = new Date(attempt.startedAt).getTime()
    for (const a of ordered) {
      const t = new Date(a.answeredAt).getTime()
      const dwellSec = Math.max(0, Math.min(600, (t - prevTime) / 1000)) // clamp to 10 min
      prevTime = t

      const entry = sumByQuestion.get(a.questionId) || { sum: 0, count: 0 }
      entry.sum += dwellSec
      entry.count += 1
      sumByQuestion.set(a.questionId, entry)

      if (attempt.id === myAttemptId) myDwellByQuestion.set(a.questionId, dwellSec)
    }
  }

  const avgByQuestion = new Map<string, number>()
  for (const [questionId, { sum, count }] of sumByQuestion) {
    avgByQuestion.set(questionId, sum / count)
  }

  return { myDwellByQuestion, avgByQuestion, sampleSize: attempts.length }
}

const MIN_ATTEMPTS_FOR_DISCRIMINATION = 10 // need real top/bottom groups, not just 1-2 people each

// Classic item analysis: difficulty (% correct) and discrimination (top-27%
// vs bottom-27% scorers' correct-rate gap — the standard "upper-lower group"
// method used in psychometrics). A negative discrimination means students
// who did WELL overall got THIS question wrong more than students who did
// poorly — a red flag for a broken/mis-keyed question.
export async function getExamItemAnalysis(mockExamId: string) {
  const [questions, attempts] = await Promise.all([
    prisma.mockQuestion.findMany({
      where: { mockExamId },
      include: { options: { orderBy: { order: "asc" } }, topic: { select: { id: true, name: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.mockExamAttempt.findMany({
      where: { mockExamId, mode: "REAL", status: "COMPLETED" },
      select: { id: true, percentage: true, passed: true },
    }),
  ])

  const totalAttempts = attempts.length
  const passRate = totalAttempts > 0 ? Math.round((attempts.filter((a) => a.passed).length / totalAttempts) * 100) : null
  const avgPercentage = totalAttempts > 0 ? Math.round((attempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts) * 10) / 10 : null

  const distributionBuckets = [
    { label: "0-20%", min: 0, max: 20, count: 0 },
    { label: "21-40%", min: 21, max: 40, count: 0 },
    { label: "41-60%", min: 41, max: 60, count: 0 },
    { label: "61-80%", min: 61, max: 80, count: 0 },
    { label: "81-100%", min: 81, max: 100, count: 0 },
  ]
  for (const a of attempts) {
    const bucket = distributionBuckets.find((b) => a.percentage >= b.min && a.percentage <= b.max)
    if (bucket) bucket.count += 1
  }

  // Upper/lower 27% groups by overall exam score, for discrimination.
  const sorted = [...attempts].sort((a, b) => b.percentage - a.percentage)
  const groupSize = Math.max(1, Math.round(sorted.length * 0.27))
  const topGroupIds = new Set(sorted.slice(0, groupSize).map((a) => a.id))
  const bottomGroupIds = new Set(sorted.slice(-groupSize).map((a) => a.id))
  const canComputeDiscrimination = totalAttempts >= MIN_ATTEMPTS_FOR_DISCRIMINATION

  const questionIds = questions.map((q) => q.id)
  const allAnswers = questionIds.length
    ? await prisma.mockStudentAnswer.findMany({
        where: { questionId: { in: questionIds }, attemptId: { in: attempts.map((a) => a.id) } },
        select: { questionId: true, optionId: true, isCorrect: true, attemptId: true },
      })
    : []

  const answersByQuestion = new Map<string, typeof allAnswers>()
  for (const a of allAnswers) {
    const list = answersByQuestion.get(a.questionId) || []
    list.push(a)
    answersByQuestion.set(a.questionId, list)
  }

  const questionStats = questions.map((q) => {
    const qAnswers = answersByQuestion.get(q.id) || []
    const answeredCount = qAnswers.length
    const correctCount = qAnswers.filter((a) => a.isCorrect).length
    const difficultyPercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : null

    let discrimination: number | null = null
    if (canComputeDiscrimination) {
      const topAnswers = qAnswers.filter((a) => topGroupIds.has(a.attemptId))
      const bottomAnswers = qAnswers.filter((a) => bottomGroupIds.has(a.attemptId))
      if (topAnswers.length > 0 && bottomAnswers.length > 0) {
        const topCorrectRate = topAnswers.filter((a) => a.isCorrect).length / topAnswers.length
        const bottomCorrectRate = bottomAnswers.filter((a) => a.isCorrect).length / bottomAnswers.length
        discrimination = Math.round((topCorrectRate - bottomCorrectRate) * 100) / 100 // -1..1
      }
    }

    const optionCounts = new Map<string, number>()
    for (const a of qAnswers) {
      if (!a.optionId) continue
      optionCounts.set(a.optionId, (optionCounts.get(a.optionId) || 0) + 1)
    }
    const optionStats = q.options.map((o) => ({
      id: o.id,
      optionText: o.optionText,
      isCorrect: o.isCorrect,
      pickedCount: optionCounts.get(o.id) || 0,
      pickedPercent: answeredCount > 0 ? Math.round(((optionCounts.get(o.id) || 0) / answeredCount) * 100) : 0,
    }))
    const isDeadDistractor = (o: (typeof optionStats)[number]) => !o.isCorrect && o.pickedCount === 0 && answeredCount > 0

    return {
      id: q.id,
      order: q.order,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      topic: q.topic,
      answeredCount,
      difficultyPercent,
      discrimination,
      isFlagged: (difficultyPercent != null && (difficultyPercent < 20 || difficultyPercent > 95)) || (discrimination != null && discrimination < 0),
      optionStats: q.questionType === "SHORT_ANSWER" ? [] : optionStats,
      deadDistractorCount: q.questionType === "SHORT_ANSWER" ? 0 : optionStats.filter(isDeadDistractor).length,
    }
  })

  return {
    totalAttempts,
    passRate,
    avgPercentage,
    distributionBuckets,
    discriminationAvailable: canComputeDiscrimination,
    questionStats,
  }
}

export async function getMistakeShareByQuestion(questionIds: string[]) {
  if (questionIds.length === 0) return new Map<string, { total: number; shares: Map<string, number> }>()

  const wrongAnswers = await prisma.mockStudentAnswer.findMany({
    where: { questionId: { in: questionIds }, isCorrect: false, optionId: { not: null } },
    select: { questionId: true, optionId: true },
  })

  const perQuestion = new Map<string, { total: number; byOption: Map<string, number> }>()
  for (const a of wrongAnswers) {
    const entry = perQuestion.get(a.questionId) || { total: 0, byOption: new Map<string, number>() }
    entry.total += 1
    entry.byOption.set(a.optionId!, (entry.byOption.get(a.optionId!) || 0) + 1)
    perQuestion.set(a.questionId, entry)
  }

  const result = new Map<string, { total: number; shares: Map<string, number> }>()
  for (const [questionId, { total, byOption }] of perQuestion) {
    const shares = new Map<string, number>()
    for (const [optionId, count] of byOption) {
      shares.set(optionId, Math.round((count / total) * 100))
    }
    result.set(questionId, { total, shares })
  }
  return result
}
