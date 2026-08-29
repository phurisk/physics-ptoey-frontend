import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/mock-exams - list mock exams
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const search = searchParams.get("search") || ""
    const subject = searchParams.get("subject") || ""
    const status = searchParams.get("status") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.MockExamWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (subject) where.subject = subject as Prisma.MockExamWhereInput["subject"]
    if (status === "active") where.isActive = true
    if (status === "inactive") where.isActive = false

    const [totalCount, exams] = await Promise.all([
      prisma.mockExam.count({ where }),
      prisma.mockExam.findMany({
        where,
        include: { course: { select: { id: true, title: true } }, _count: { select: { questions: true, attempts: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (error) {
    console.error("Get admin mock exams error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบจำลอง" }, { status: 500 })
  }
}

// POST: /api/admin/mock-exams - create a mock exam
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title || !body.subject) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }
    const allowPracticeMode = body.allowPracticeMode ?? true
    const allowRealMode = body.allowRealMode ?? true
    if (!allowPracticeMode && !allowRealMode) {
      return NextResponse.json({ success: false, error: "ต้องเปิดโหมดฝึกซ้อมหรือโหมดสอบจริงอย่างน้อยหนึ่งโหมด" }, { status: 400 })
    }
    if (body.courseId) {
      const course = await prisma.course.findUnique({ where: { id: body.courseId } })
      if (!course) return NextResponse.json({ success: false, error: "ไม่พบคอร์สที่เลือก" }, { status: 400 })
    }

    const exam = await prisma.mockExam.create({
      data: {
        title: body.title,
        description: body.description || null,
        courseId: body.courseId || null,
        subject: body.subject,
        gradeLevel: body.gradeLevel || null,
        timeLimit: body.timeLimit ? parseInt(body.timeLimit, 10) : null,
        price: body.price ? parseFloat(body.price) : 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        passingMarks: body.passingMarks ? parseInt(body.passingMarks, 10) : 0,
        attemptsAllowed: body.attemptsAllowed ? parseInt(body.attemptsAllowed, 10) : 1,
        allowPracticeMode,
        allowRealMode,
        practiceUnlockCost: body.practiceUnlockCost ? parseInt(body.practiceUnlockCost, 10) : 1,
        isActive: body.isActive ?? true,
        examPdfUrl: body.examPdfUrl || null,
      },
    })
    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Create mock exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างข้อสอบจำลอง" }, { status: 400 })
  }
}
