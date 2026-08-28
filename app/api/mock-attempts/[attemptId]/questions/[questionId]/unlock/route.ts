import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { isQuestionUnlocked, getOrCreateWallet } from "@/lib/mockExamEngine"

// POST: /api/mock-attempts/[attemptId]/questions/[questionId]/unlock
// PRACTICE-only: spend a practice token to permanently reveal a question.
// The unlock is keyed to (userId, questionId) — not the attempt — so
// revisiting the same question later (even in a different practice attempt)
// is free forever once unlocked.
export async function POST(_req: Request, { params }: { params: Promise<{ attemptId: string; questionId: string }> }) {
  const user = requireUser(_req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId, questionId } = await params

    const attempt = await prisma.mockExamAttempt.findUnique({ where: { id: attemptId }, include: { mockExam: true } })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (attempt.mode !== "PRACTICE") {
      return NextResponse.json({ success: false, error: "ปลดล็อกได้เฉพาะโหมดฝึกซ้อม" }, { status: 400 })
    }
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ success: false, error: "การทำข้อสอบนี้สิ้นสุดแล้ว" }, { status: 400 })
    }

    const question = await prisma.mockQuestion.findFirst({
      where: { id: questionId, mockExamId: attempt.mockExamId },
      include: { options: { orderBy: { order: "asc" } } },
    })
    if (!question) return NextResponse.json({ success: false, error: "ไม่พบคำถามนี้" }, { status: 404 })

    const alreadyUnlocked = await isQuestionUnlocked(user.userId, questionId)
    let wallet = await getOrCreateWallet(user.userId)

    if (!alreadyUnlocked) {
      if (wallet.tokens < attempt.mockExam.practiceUnlockCost) {
        return NextResponse.json({ success: false, error: "โทเคนฝึกซ้อมไม่เพียงพอ" }, { status: 409 })
      }
      const [updatedWallet] = await prisma.$transaction([
        prisma.mockPracticeWallet.update({
          where: { userId: user.userId },
          data: { tokens: { decrement: attempt.mockExam.practiceUnlockCost } },
        }),
        prisma.mockPracticeUnlock.create({ data: { userId: user.userId, questionId } }),
      ])
      wallet = updatedWallet
    }

    const priorAnswer = await prisma.mockStudentAnswer.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    })

    return NextResponse.json({
      success: true,
      data: {
        practiceTokens: wallet.tokens,
        question: {
          id: question.id,
          order: question.order,
          marks: question.marks,
          locked: false,
          questionText: question.questionText,
          questionImage: question.questionImage,
          questionType: question.questionType,
          options: question.options,
          explanation: question.explanation,
          explanationImages: question.explanationImages,
          answer: priorAnswer
            ? { optionId: priorAnswer.optionId, textAnswer: priorAnswer.textAnswer, isCorrect: priorAnswer.isCorrect }
            : null,
        },
      },
    })
  } catch (error) {
    console.error("Unlock mock question error:", error)
    return NextResponse.json({ success: false, error: "Failed to unlock question" }, { status: 500 })
  }
}
