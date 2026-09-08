import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { isQuestionUnlocked, getOrCreateWallet } from "@/lib/mockExamEngine"

// GET: /api/mock-attempts/[attemptId] - the "taking exam" view.
// Neither mode leaks isCorrect or the explanation while IN_PROGRESS — that
// information only appears after submit, on the result page. PRACTICE
// additionally hides not-yet-unlocked question content entirely.
export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params
    const attempt = await prisma.mockExamAttempt.findUnique({
      where: { id: attemptId },
      include: { mockExam: true },
    })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ success: false, error: "การทำข้อสอบนี้สิ้นสุดแล้ว" }, { status: 400 })
    }

    const [questions, existingAnswers] = await Promise.all([
      prisma.mockQuestion.findMany({
        where: { mockExamId: attempt.mockExamId, isActive: true },
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      }),
      prisma.mockStudentAnswer.findMany({ where: { attemptId } }),
    ])
    const answerByQuestion = new Map(existingAnswers.map((a) => [a.questionId, a]))

    const isPractice = attempt.mode === "PRACTICE"
    const questionPayloads = await Promise.all(
      questions.map(async (q) => {
        const priorAnswer = answerByQuestion.get(q.id)

        if (isPractice) {
          const unlocked = await isQuestionUnlocked(user.userId, q.id)
          if (!unlocked) {
            return { id: q.id, order: q.order, marks: q.marks, locked: true }
          }
          return {
            id: q.id,
            order: q.order,
            marks: q.marks,
            locked: false,
            questionText: q.questionText,
            questionImage: q.questionImage,
            questionType: q.questionType,
            options: q.options.map((o) => ({ id: o.id, optionText: o.optionText, optionImage: o.optionImage, order: o.order })),
            answer: priorAnswer ? { optionId: priorAnswer.optionId, textAnswer: priorAnswer.textAnswer } : null,
          }
        }

        // REAL mode: same shape, minus the unlock gate.
        return {
          id: q.id,
          order: q.order,
          marks: q.marks,
          locked: false,
          questionText: q.questionText,
          questionImage: q.questionImage,
          questionType: q.questionType,
          options: q.options.map((o) => ({ id: o.id, optionText: o.optionText, optionImage: o.optionImage, order: o.order })),
          answer: priorAnswer ? { optionId: priorAnswer.optionId, textAnswer: priorAnswer.textAnswer } : null,
        }
      })
    )

    let remainingSeconds: number | null = null
    if (attempt.mode === "REAL" && attempt.mockExam.timeLimit) {
      const deadline = attempt.startedAt.getTime() + attempt.mockExam.timeLimit * 60_000
      remainingSeconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    }

    const practiceTokens = isPractice ? (await getOrCreateWallet(user.userId)).tokens : null

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        mode: attempt.mode,
        exam: {
          id: attempt.mockExam.id,
          title: attempt.mockExam.title,
          timeLimit: attempt.mockExam.timeLimit,
          // Proxy path, not the raw Vercel Blob URL — see the pdf route's
          // comment for why: no downloadable link should ever reach the client.
          examPdfUrl: attempt.mockExam.examPdfUrl ? `/api/mock-attempts/${attempt.id}/pdf` : null,
        },
        questions: questionPayloads,
        remainingSeconds,
        practiceTokens,
        practiceUnlockCost: attempt.mockExam.practiceUnlockCost,
      },
    })
  } catch (error) {
    console.error("Get mock attempt error:", error)
    return NextResponse.json({ success: false, error: "Failed to load attempt" }, { status: 500 })
  }
}
