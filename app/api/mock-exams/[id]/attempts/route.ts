import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { hasMockExamAccess } from "@/lib/mockExamEngine"

// POST: /api/mock-exams/[id]/attempts - start (or resume) an attempt
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: mockExamId } = await params
    const body = await req.json().catch(() => ({}))
    const mode = body?.mode

    if (mode !== "PRACTICE" && mode !== "REAL") {
      return NextResponse.json({ success: false, error: "mode must be PRACTICE or REAL" }, { status: 400 })
    }

    const exam = await prisma.mockExam.findUnique({
      where: { id: mockExamId },
      include: { questions: { where: { isActive: true } } },
    })
    if (!exam || !exam.isActive) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })
    if (exam.questions.length === 0) return NextResponse.json({ success: false, error: "ข้อสอบนี้ยังไม่มีคำถาม" }, { status: 400 })

    if (mode === "PRACTICE" && !exam.allowPracticeMode) {
      return NextResponse.json({ success: false, error: "ข้อสอบนี้ไม่เปิดโหมดฝึกซ้อม" }, { status: 400 })
    }
    if (mode === "REAL" && !exam.allowRealMode) {
      return NextResponse.json({ success: false, error: "ข้อสอบนี้ไม่เปิดโหมดสอบจริง" }, { status: 400 })
    }

    const existingInProgress = await prisma.mockExamAttempt.findFirst({
      where: { mockExamId, userId: user.userId, mode, status: "IN_PROGRESS" },
    })
    if (existingInProgress) {
      return NextResponse.json({ success: true, data: { attemptId: existingInProgress.id, mode } })
    }

    if (mode === "REAL") {
      const hasAccess = await hasMockExamAccess(user.userId, exam)
      if (!hasAccess) return NextResponse.json({ success: false, error: "กรุณาซื้อข้อสอบนี้ก่อนทำการสอบจริง" }, { status: 403 })

      const completedRealAttempts = await prisma.mockExamAttempt.count({
        where: { mockExamId, userId: user.userId, mode: "REAL", status: "COMPLETED" },
      })
      if (completedRealAttempts >= exam.attemptsAllowed) {
        return NextResponse.json({ success: false, error: "คุณใช้สิทธิ์การสอบจริงครบแล้ว" }, { status: 403 })
      }
    }

    const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0)
    const attempt = await prisma.mockExamAttempt.create({
      data: { mockExamId, userId: user.userId, mode, totalMarks },
    })

    return NextResponse.json({ success: true, data: { attemptId: attempt.id, mode } })
  } catch (error) {
    console.error("Start mock exam attempt error:", error)
    return NextResponse.json({ success: false, error: "Failed to start attempt" }, { status: 500 })
  }
}
