import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

type OptionInput = { optionText: string; isCorrect?: boolean; order?: number }

function validateOptions(questionType: string, options: OptionInput[]) {
  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    if (!options || options.length < 2) return "กรุณาเพิ่มตัวเลือกอย่างน้อย 2 ตัวเลือก"
    if (!options.some((o) => o.isCorrect)) return "กรุณาเลือกคำตอบที่ถูกต้องอย่างน้อย 1 ตัวเลือก"
  } else if (questionType === "SHORT_ANSWER") {
    if (!options || !options[0]?.optionText?.trim()) return "กรุณากรอกคำตอบที่ถูกต้อง"
  }
  return null
}

// GET: /api/admin/mock-exam-questions/[id] - get a single question
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const question = await prisma.mockQuestion.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: "asc" } },
        topic: true,
        mockExam: { select: { id: true, title: true, subject: true } },
        _count: { select: { answers: true } },
      },
    })
    if (!question) return NextResponse.json({ success: false, error: "ไม่พบคำถาม" }, { status: 404 })

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error("Get mock exam question error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำถาม" }, { status: 500 })
  }
}

// PUT: /api/admin/mock-exam-questions/[id] - update a question, fully replacing its options
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.mockQuestion.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบคำถาม" }, { status: 404 })
    if (body.topicId) {
      const topic = await prisma.mockTopic.findUnique({ where: { id: body.topicId } })
      if (!topic) return NextResponse.json({ success: false, error: "ไม่พบหัวข้อที่เลือก" }, { status: 400 })
    }

    const options = (body.options || []) as OptionInput[]
    const validationError = validateOptions(body.questionType, options)
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 })

    const isShortAnswer = body.questionType === "SHORT_ANSWER"

    const question = await prisma.$transaction(async (tx) => {
      await tx.mockQuestionOption.deleteMany({ where: { questionId: id } })
      return tx.mockQuestion.update({
        where: { id },
        data: {
          topicId: body.topicId || null,
          questionText: body.questionText,
          questionImage: body.questionImage || null,
          questionType: body.questionType,
          marks: body.marks ? parseInt(body.marks, 10) : 1,
          numericTolerance: isShortAnswer && body.numericTolerance !== "" && body.numericTolerance != null ? parseFloat(body.numericTolerance) : null,
          explanation: body.explanation || null,
          explanationImages: Array.isArray(body.explanationImages) ? body.explanationImages : [],
          options: {
            create: options.map((o, idx) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect, order: o.order ?? idx })),
          },
        },
        include: { options: { orderBy: { order: "asc" } } },
      })
    })

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error("Update mock exam question error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขคำถาม" }, { status: 400 })
  }
}

// DELETE: /api/admin/mock-exam-questions/[id] - delete a question (blocked if answered)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const question = await prisma.mockQuestion.findUnique({ where: { id }, include: { _count: { select: { answers: true } } } })
    if (!question) return NextResponse.json({ success: false, error: "ไม่พบคำถาม" }, { status: 404 })
    if (question._count.answers > 0) {
      return NextResponse.json({ success: false, error: `ไม่สามารถลบได้ เนื่องจากมีนักเรียนตอบคำถามนี้แล้ว ${question._count.answers} คำตอบ` }, { status: 400 })
    }

    await prisma.mockQuestion.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบคำถามสำเร็จ" })
  } catch (error) {
    console.error("Delete mock exam question error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบคำถาม" }, { status: 400 })
  }
}
