import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

type OptionInput = { optionText: string; isCorrect?: boolean; order?: number }

// GET: /api/admin/exams/[examId]/questions - list all questions for an exam
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: examId } = await params

    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true, title: true } })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    const questions = await prisma.question.findMany({
      where: { examId },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ success: true, data: { exam, questions } })
  } catch (error) {
    console.error("Get questions error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำถาม" }, { status: 500 })
  }
}

// POST: /api/admin/exams/[examId]/questions - create a question with its options
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: examId } = await params
    const body = await req.json()

    if (!body.questionText) {
      return NextResponse.json({ success: false, error: "กรุณากรอกคำถาม" }, { status: 400 })
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    const options = (body.options || []) as OptionInput[]

    const question = await prisma.question.create({
      data: {
        examId,
        questionText: body.questionText,
        questionImage: body.questionImage || null,
        questionType: body.questionType || "MULTIPLE_CHOICE",
        marks: body.marks ? parseInt(body.marks, 10) : 1,
        explanation: body.explanation || null,
        options:
          options.length > 0
            ? {
                create: options.map((o, idx) => ({
                  optionText: o.optionText,
                  isCorrect: !!o.isCorrect,
                  order: o.order ?? idx,
                })),
              }
            : undefined,
      },
      include: { options: { orderBy: { order: "asc" } } },
    })

    await recomputeExamTotalMarks(examId)

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error("Create question error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างคำถาม" }, { status: 400 })
  }
}

// Keeps Exam.totalMarks (a cached display/summary value) in sync with the
// sum of its questions' marks — grading itself reads ExamAttempt.totalMarks,
// snapshotted per-attempt, so this only affects the admin-facing summary.
export async function recomputeExamTotalMarks(examId: string) {
  const questions = await prisma.question.findMany({ where: { examId }, select: { marks: true } })
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
  await prisma.exam.update({ where: { id: examId }, data: { totalMarks } })
}
