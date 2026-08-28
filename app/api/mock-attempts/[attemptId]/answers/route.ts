import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { gradeAnswer, isQuestionUnlocked } from "@/lib/mockExamEngine"

// POST: /api/mock-attempts/[attemptId]/answers - autosave + grade one answer.
// PRACTICE requires the question be unlocked first. REAL always grades and
// stores the result, but never reveals it in the response until submit/result.
export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params
    const body = await req.json().catch(() => ({}))
    const { questionId, optionId, textAnswer } = body || {}
    if (!questionId) return NextResponse.json({ success: false, error: "questionId is required" }, { status: 400 })

    const attempt = await prisma.mockExamAttempt.findUnique({ where: { id: attemptId } })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ success: false, error: "การทำข้อสอบนี้สิ้นสุดแล้ว" }, { status: 400 })
    }

    const question = await prisma.mockQuestion.findFirst({
      where: { id: questionId, mockExamId: attempt.mockExamId },
      include: { options: true },
    })
    if (!question) return NextResponse.json({ success: false, error: "ไม่พบคำถามนี้" }, { status: 404 })

    if (attempt.mode === "PRACTICE") {
      const unlocked = await isQuestionUnlocked(user.userId, questionId)
      if (!unlocked) return NextResponse.json({ success: false, error: "กรุณาปลดล็อกคำถามนี้ก่อน" }, { status: 400 })
    }

    const graded = gradeAnswer(question, question.options, { optionId, textAnswer })

    const answer = await prisma.mockStudentAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { optionId: optionId ?? null, textAnswer: textAnswer ?? null, isCorrect: graded.isCorrect, marks: graded.marks },
      create: {
        attemptId,
        questionId,
        optionId: optionId ?? null,
        textAnswer: textAnswer ?? null,
        isCorrect: graded.isCorrect,
        marks: graded.marks,
      },
    })

    const isPractice = attempt.mode === "PRACTICE"
    return NextResponse.json({
      success: true,
      data: {
        questionId,
        isCorrect: isPractice ? answer.isCorrect : undefined,
        marksAwarded: isPractice ? answer.marks : undefined,
      },
    })
  } catch (error) {
    console.error("Save mock exam answer error:", error)
    return NextResponse.json({ success: false, error: "Failed to save answer" }, { status: 500 })
  }
}
