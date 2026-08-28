import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/exams/[id] - get a single exam
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Get exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบ" }, { status: 500 })
  }
}

// PUT: /api/admin/exams/[id] - update an exam
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existingExam = await prisma.exam.findUnique({ where: { id } })
    if (!existingExam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        courseId: body.courseId || null,
        examType: body.examType,
        timeLimit: body.timeLimit ? parseInt(body.timeLimit, 10) : null,
        passingMarks: body.passingMarks ? parseInt(body.passingMarks, 10) : 0,
        attemptsAllowed: body.attemptsAllowed ? parseInt(body.attemptsAllowed, 10) : 1,
        showResults: body.showResults ?? true,
        showAnswers: body.showAnswers ?? false,
        isActive: body.isActive ?? true,
      },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    })

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Update exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อสอบ" }, { status: 400 })
  }
}

// DELETE: /api/admin/exams/[id] - delete an exam and its questions/options
// Blocked if any student has already attempted the exam.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({ where: { id } })
      if (!exam) throw new Error("ไม่พบข้อสอบ")

      const attemptCount = await tx.examAttempt.count({ where: { examId: id } })
      if (attemptCount > 0) {
        throw new Error(`ไม่สามารถลบข้อสอบได้ เนื่องจากมีนักเรียนทำข้อสอบนี้แล้ว ${attemptCount} คน`)
      }

      // Question/QuestionOption both cascade on delete of their parent, so
      // deleting the exam is enough once we've confirmed no attempts exist.
      await tx.exam.delete({ where: { id } })

      return { id: exam.id, title: exam.title }
    })

    return NextResponse.json({ success: true, message: "ลบข้อสอบสำเร็จ", data: result })
  } catch (error) {
    console.error("Delete exam error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบข้อสอบ" },
      { status: 400 }
    )
  }
}
