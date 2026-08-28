import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

const WEAK_TOPIC_THRESHOLD_PERCENT = 60

// GET: /api/mock-attempts/[attemptId]/result - full reveal + per-topic breakdown.
// Only available once the attempt is COMPLETED.
export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params
    const attempt = await prisma.mockExamAttempt.findUnique({
      where: { id: attemptId },
      include: { mockExam: { select: { id: true, title: true, passingMarks: true } } },
    })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (attempt.status !== "COMPLETED") {
      return NextResponse.json({ success: false, error: "การทำข้อสอบนี้ยังไม่เสร็จสิ้น" }, { status: 400 })
    }

    const [questions, answers] = await Promise.all([
      prisma.mockQuestion.findMany({
        where: { mockExamId: attempt.mockExamId, isActive: true },
        include: { options: { orderBy: { order: "asc" } }, topic: { select: { id: true, name: true } } },
        orderBy: { order: "asc" },
      }),
      prisma.mockStudentAnswer.findMany({ where: { attemptId } }),
    ])
    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]))

    const questionResults = questions.map((q) => {
      const answer = answerByQuestion.get(q.id)
      return {
        id: q.id,
        order: q.order,
        marks: q.marks,
        questionText: q.questionText,
        questionImage: q.questionImage,
        questionType: q.questionType,
        options: q.options,
        explanation: q.explanation,
        explanationImages: q.explanationImages,
        topic: q.topic,
        answer: answer ? { optionId: answer.optionId, textAnswer: answer.textAnswer, isCorrect: answer.isCorrect, marks: answer.marks } : null,
      }
    })

    const topicMap = new Map<string, { topicId: string; topicName: string; correct: number; total: number }>()
    for (const q of questions) {
      if (!q.topic) continue
      const answer = answerByQuestion.get(q.id)
      const entry = topicMap.get(q.topic.id) ?? { topicId: q.topic.id, topicName: q.topic.name, correct: 0, total: 0 }
      entry.total += 1
      if (answer?.isCorrect) entry.correct += 1
      topicMap.set(q.topic.id, entry)
    }
    const topicBreakdown = Array.from(topicMap.values())
      .map((t) => ({ ...t, percent: t.total > 0 ? (t.correct / t.total) * 100 : 0, isWeak: false }))
      .map((t) => ({ ...t, isWeak: t.percent < WEAK_TOPIC_THRESHOLD_PERCENT }))
      .sort((a, b) => a.percent - b.percent)

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        mode: attempt.mode,
        exam: attempt.mockExam,
        totalMarks: attempt.totalMarks,
        obtainedMarks: attempt.obtainedMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        completedAt: attempt.completedAt,
        questions: questionResults,
        topicBreakdown,
      },
    })
  } catch (error) {
    console.error("Get mock attempt result error:", error)
    return NextResponse.json({ success: false, error: "Failed to load result" }, { status: 500 })
  }
}
