import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { getScoreTimeComparison, getQuestionTimings, getMistakeShareByQuestion } from "@/lib/mockExamAnalytics"

const WEAK_TOPIC_THRESHOLD_PERCENT = 60

// GET: /api/mock-attempts/[attemptId]/result - full graded review, only
// once the attempt is COMPLETED. Every question is fully revealed here
// regardless of mode (the attempt is over), plus a per-topic breakdown,
// percentile comparison vs other REAL attempts, per-question timing, and
// mistake-pattern stats (how many others picked the same wrong option).
export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params
    const attempt = await prisma.mockExamAttempt.findUnique({
      where: { id: attemptId },
      include: { mockExam: { select: { id: true, title: true, subject: true, gradeLevel: true, passingMarks: true } } },
    })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (attempt.status !== "COMPLETED") {
      return NextResponse.json({ success: false, error: "การทำข้อสอบนี้ยังไม่เสร็จสิ้น" }, { status: 400 })
    }

    const questions = await prisma.mockQuestion.findMany({
      where: { mockExamId: attempt.mockExamId, isActive: true },
      include: { options: { orderBy: { order: "asc" } }, topic: { select: { id: true, name: true } } },
      orderBy: { order: "asc" },
    })

    const answers = await prisma.mockStudentAnswer.findMany({ where: { attemptId } })
    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]))

    const wrongQuestionIds = answers.filter((a) => a.isCorrect === false && a.optionId).map((a) => a.questionId)
    const [comparison, timings, mistakeShares] = await Promise.all([
      getScoreTimeComparison(attempt.mockExamId, attempt.id),
      getQuestionTimings(attempt.mockExamId, attempt.id),
      getMistakeShareByQuestion(wrongQuestionIds),
    ])

    const questionReviews = questions.map((q) => {
      const answer = answerByQuestion.get(q.id) || null
      const mistake = mistakeShares.get(q.id)
      return {
        id: q.id,
        order: q.order,
        questionText: q.questionText,
        questionImage: q.questionImage,
        questionType: q.questionType,
        marks: q.marks,
        topic: q.topic,
        explanation: q.explanation,
        explanationImages: q.explanationImages,
        options: q.options.map((o) => ({ id: o.id, optionText: o.optionText, isCorrect: o.isCorrect })),
        studentAnswer: answer
          ? { optionId: answer.optionId, textAnswer: answer.textAnswer, isCorrect: answer.isCorrect, marksAwarded: answer.marks }
          : null,
        timing:
          timings.myDwellByQuestion.has(q.id) && timings.sampleSize >= 3
            ? { mySec: Math.round(timings.myDwellByQuestion.get(q.id)!), avgSec: Math.round(timings.avgByQuestion.get(q.id) ?? 0) }
            : null,
        // Only meaningful when this specific student picked that option wrong — the
        // share is "of everyone who ALSO got this wrong, % who picked the same option."
        mistakeSharePercent:
          answer && answer.isCorrect === false && answer.optionId && mistake ? mistake.shares.get(answer.optionId) ?? null : null,
      }
    })

    const topicStats = new Map<string, { topicName: string; correct: number; total: number }>()
    for (const q of questionReviews) {
      if (!q.topic || !q.studentAnswer || q.studentAnswer.isCorrect == null) continue
      const entry = topicStats.get(q.topic.id) || { topicName: q.topic.name, correct: 0, total: 0 }
      entry.total += 1
      if (q.studentAnswer.isCorrect) entry.correct += 1
      topicStats.set(q.topic.id, entry)
    }

    const topicBreakdown = Array.from(topicStats.entries())
      .map(([topicId, { topicName, correct, total }]) => {
        const percent = total > 0 ? (correct / total) * 100 : 0
        return { topicId, topicName, correct, total, percent, isWeak: percent < WEAK_TOPIC_THRESHOLD_PERCENT }
      })
      .sort((a, b) => a.percent - b.percent)

    // Suggest courses in the same subject/level as this exam. Guard
    // explicitly against a missing subject: Prisma silently DROPS a `where`
    // key whose value is `undefined` (unlike `null`), which would turn
    // `subject: undefined` into "no subject filter at all" — never let that
    // happen here.
    const recommendedCourses = attempt.mockExam.subject
      ? await prisma.course.findMany({
          where: {
            status: "PUBLISHED",
            subject: attempt.mockExam.subject,
            ...(attempt.mockExam.gradeLevel ? { gradeLevel: attempt.mockExam.gradeLevel } : {}),
          },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            discountPrice: true,
            duration: true,
            isFree: true,
            subject: true,
            gradeLevel: true,
            coverImageUrl: true,
            category: { select: { id: true, name: true, description: true } },
            _count: { select: { enrollments: true, chapters: true } },
          },
          orderBy: [{ isRecommended: "desc" }, { createdAt: "desc" }],
          take: 3,
        })
      : []

    return NextResponse.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          mode: attempt.mode,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          totalMarks: attempt.totalMarks,
          obtainedMarks: attempt.obtainedMarks,
          percentage: attempt.percentage,
          passed: attempt.passed,
        },
        mockExam: attempt.mockExam,
        questions: questionReviews,
        topicBreakdown,
        comparison,
        recommendedCourses,
      },
    })
  } catch (error) {
    console.error("Error fetching mock attempt result:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการโหลดผลข้อสอบ" }, { status: 500 })
  }
}
