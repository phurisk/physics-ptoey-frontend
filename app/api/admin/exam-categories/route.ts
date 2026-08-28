import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/exam-categories - list exam categories with search and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.ExamCategoryWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [totalCount, categories] = await Promise.all([
      prisma.examCategory.count({ where }),
      prisma.examCategory.findMany({
        where,
        include: { _count: { select: { exams: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get exam categories error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ข้อสอบ" }, { status: 500 })
  }
}

// POST: /api/admin/exam-categories - create an exam category
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ success: false, error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 })
    }

    const existing = await prisma.examCategory.findUnique({ where: { name: body.name } })
    if (existing) {
      return NextResponse.json({ success: false, error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" }, { status: 400 })
    }

    const category = await prisma.examCategory.create({
      data: {
        name: body.name,
        description: body.description || null,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Create exam category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่ข้อสอบ" }, { status: 400 })
  }
}
