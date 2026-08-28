import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/exams - list in-course exams with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const courseId = searchParams.get("courseId") || ""
    const examType = searchParams.get("examType") || ""
    const isActive = searchParams.get("isActive") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.ExamWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (courseId) where.courseId = courseId
    if (examType) where.examType = examType as Prisma.ExamWhereInput["examType"]
    if (isActive === "true") where.isActive = true
    else if (isActive === "false") where.isActive = false

    let orderBy: Prisma.ExamOrderByWithRelationInput = {}
    if (sortBy === "course") orderBy = { course: { title: sortOrder } }
    else orderBy = { [sortBy]: sortOrder }

    const [totalCount, exams] = await Promise.all([
      prisma.exam.count({ where }),
      prisma.exam.findMany({
        where,
        include: {
          course: { select: { id: true, title: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get exams error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบ" }, { status: 500 })
  }
}

// POST: /api/admin/exams - create an in-course exam
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title) {
      return NextResponse.json({ success: false, error: "กรุณากรอกชื่อข้อสอบ" }, { status: 400 })
    }

    const exam = await prisma.exam.create({
      data: {
        title: body.title,
        description: body.description || null,
        courseId: body.courseId || null,
        examType: body.examType || "QUIZ",
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
    console.error("Create exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างข้อสอบ" }, { status: 400 })
  }
}
