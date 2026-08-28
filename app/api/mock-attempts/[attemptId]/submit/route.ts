import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// POST: /api/mock-attempts/[attemptId]/submit - finalize an attempt.
// Does NOT re-grade; just sums the already-graded MockStudentAnswer rows.
export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params
    const attempt = await prisma.mockExamAttempt.findUnique({ where: { id: attemptId } })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ success: true, data: { attemptId, alreadySubmitted: true } })
    }

    const [totalMarksAgg, answers, exam] = await Promise.all([
      prisma.mockQuestion.aggregate({ where: { mockExamId: attempt.mockExamId, isActive: true }, _sum: { marks: true } }),
      prisma.mockStudentAnswer.findMany({ where: { attemptId } }),
      prisma.mockExam.findUnique({ where: { id: attempt.mockExamId }, select: { passingMarks: true } }),
    ])

    const totalMarks = totalMarksAgg._sum.marks ?? 0
    const obtainedMarks = answers.reduce((sum, a) => sum + a.marks, 0)
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
    const passed = obtainedMarks >= (exam?.passingMarks ?? 0)

    await prisma.mockExamAttempt.update({
      where: { id: attemptId },
      data: { status: "COMPLETED", completedAt: new Date(), totalMarks, obtainedMarks, percentage, passed },
    })

    return NextResponse.json({ success: true, data: { attemptId, totalMarks, obtainedMarks, percentage, passed } })
  } catch (error) {
    console.error("Submit mock attempt error:", error)
    return NextResponse.json({ success: false, error: "Failed to submit attempt" }, { status: 500 })
  }
}
