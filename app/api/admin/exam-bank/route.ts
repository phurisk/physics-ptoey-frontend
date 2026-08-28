import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/exam-bank - list exam bank entries with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const isActive = searchParams.get("isActive") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.ExamBankWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (isActive === "true") where.isActive = true
    else if (isActive === "false") where.isActive = false

    let orderBy: Prisma.ExamBankOrderByWithRelationInput = {}
    if (sortBy === "category") orderBy = { category: { name: sortOrder } }
    else if (sortBy === "fileCount") orderBy = { files: { _count: sortOrder } }
    else orderBy = { [sortBy]: sortOrder }

    const [totalCount, exams] = await Promise.all([
      prisma.examBank.count({ where }),
      prisma.examBank.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          files: { select: { id: true, fileName: true, fileType: true, fileSize: true, filePath: true, isDownload: true, uploadedAt: true } },
          _count: { select: { files: true } },
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
    console.error("Get exam bank error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคลังข้อสอบ" }, { status: 500 })
  }
}

// POST: /api/admin/exam-bank - create an exam bank entry
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title) {
      return NextResponse.json({ success: false, error: "กรุณาระบุชื่อข้อสอบ" }, { status: 400 })
    }

    if (body.categoryId) {
      const category = await prisma.examCategory.findUnique({ where: { id: body.categoryId } })
      if (!category) return NextResponse.json({ success: false, error: "ไม่พบหมวดหมู่ที่ระบุ" }, { status: 400 })
    }

    const exam = await prisma.examBank.create({
      data: {
        title: body.title,
        description: body.description || null,
        categoryId: body.categoryId || null,
        isActive: body.isActive ?? true,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Create exam bank error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างข้อสอบ" }, { status: 400 })
  }
}
