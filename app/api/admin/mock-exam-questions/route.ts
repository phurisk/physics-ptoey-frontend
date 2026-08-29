import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

type OptionInput = { optionText: string; optionImage?: string | null; isCorrect?: boolean; order?: number }

function validateOptions(questionType: string, options: OptionInput[]) {
  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    if (!options || options.length < 2) return "กรุณาเพิ่มตัวเลือกอย่างน้อย 2 ตัวเลือก"
    if (!options.some((o) => o.isCorrect)) return "กรุณาเลือกคำตอบที่ถูกต้องอย่างน้อย 1 ตัวเลือก"
  } else if (questionType === "SHORT_ANSWER") {
    if (!options || !options[0]?.optionText?.trim()) return "กรุณากรอกคำตอบที่ถูกต้อง"
  }
  return null
}

// GET: /api/admin/mock-exam-questions?mockExamId=xxx - list questions for an exam
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const mockExamId = searchParams.get("mockExamId")
    if (!mockExamId) return NextResponse.json({ success: false, error: "mockExamId is required" }, { status: 400 })

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const search = searchParams.get("search") || ""
    const questionType = searchParams.get("questionType") || ""
    const topicId = searchParams.get("topicId") || ""

    const where: Prisma.MockQuestionWhereInput = { mockExamId }
    if (search) {
      where.OR = [
        { questionText: { contains: search, mode: "insensitive" } },
        { explanation: { contains: search, mode: "insensitive" } },
      ]
    }
    if (questionType) where.questionType = questionType as Prisma.MockQuestionWhereInput["questionType"]
    if (topicId) where.topicId = topicId

    const [totalCount, questions] = await Promise.all([
      prisma.mockQuestion.count({ where }),
      prisma.mockQuestion.findMany({
        where,
        include: { options: { orderBy: { order: "asc" } }, topic: { select: { id: true, name: true } }, _count: { select: { answers: true } } },
        orderBy: { order: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (error) {
    console.error("Get mock exam questions error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำถาม" }, { status: 500 })
  }
}

// POST: /api/admin/mock-exam-questions - create a question with its options
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.questionText || !body.mockExamId || !body.questionType) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const exam = await prisma.mockExam.findUnique({ where: { id: body.mockExamId } })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบจำลอง" }, { status: 404 })
    if (body.topicId) {
      const topic = await prisma.mockTopic.findUnique({ where: { id: body.topicId } })
      if (!topic) return NextResponse.json({ success: false, error: "ไม่พบหัวข้อที่เลือก" }, { status: 400 })
    }

    const options = (body.options || []) as OptionInput[]
    const validationError = validateOptions(body.questionType, options)
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 })

    const maxOrder = await prisma.mockQuestion.aggregate({ where: { mockExamId: body.mockExamId }, _max: { order: true } })
    const isShortAnswer = body.questionType === "SHORT_ANSWER"

    const question = await prisma.mockQuestion.create({
      data: {
        mockExamId: body.mockExamId,
        topicId: body.topicId || null,
        questionText: body.questionText,
        questionImage: body.questionImage || null,
        questionType: body.questionType,
        marks: body.marks ? parseInt(body.marks, 10) : 1,
        numericTolerance: isShortAnswer && body.numericTolerance !== "" && body.numericTolerance != null ? parseFloat(body.numericTolerance) : null,
        explanation: body.explanation || null,
        explanationImages: Array.isArray(body.explanationImages) ? body.explanationImages : [],
        order: (maxOrder._max.order ?? 0) + 1,
        options: {
          create: options.map((o, idx) => ({ optionText: o.optionText, optionImage: o.optionImage || null, isCorrect: !!o.isCorrect, order: o.order ?? idx })),
        },
      },
      include: { options: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error("Create mock exam question error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างคำถาม" }, { status: 400 })
  }
}
