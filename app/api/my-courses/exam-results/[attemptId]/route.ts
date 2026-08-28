import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/my-courses/exam-results/[attemptId] - single completed attempt's
// full review, with the answer key revealed (the attempt is already over).
export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params

    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, userId: user.userId },
      include: {
        exam: { select: { id: true, title: true, description: true, course: { select: { id: true, title: true } } } },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionImage: true,
                questionType: true,
                marks: true,
                explanation: true,
                options: { select: { id: true, optionText: true, isCorrect: true }, orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    })
    if (!attempt) return NextResponse.json({ success: false, error: "ไม่พบประวัติการทำข้อสอบ" }, { status: 404 })

    const answers = [...attempt.answers]
      .sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime())
      .map((a) => ({
        questionId: a.question.id,
        questionText: a.question.questionText,
        questionImage: a.question.questionImage,
        questionType: a.question.questionType,
        marks: a.question.marks,
        explanation: a.question.explanation,
        options: a.question.options,
        studentAnswer: {
          optionId: a.optionId,
          textAnswer: a.textAnswer,
          selectedOption: a.optionId ? a.question.options.find((o) => o.id === a.optionId) : null,
          isCorrect: a.isCorrect,
          obtainedMarks: a.marks,
        },
      }))

    return NextResponse.json({
      success: true,
      result: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        totalMarks: attempt.totalMarks,
        obtainedMarks: attempt.obtainedMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        exam: attempt.exam,
        answers,
      },
    })
  } catch (error) {
    console.error("Get exam result error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงผลข้อสอบ" }, { status: 500 })
  }
}
