import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// GET: /api/exams - exam-bank (downloadable past-paper files) catalog, public
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1") || 1
    const limit = parseInt(searchParams.get("limit") || "12") || 12
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")
    const skip = (page - 1) * limit

    const where: Prisma.ExamBankWhereInput = { isActive: true }
    if (search) where.title = { contains: search, mode: "insensitive" }
    if (categoryId) where.categoryId = categoryId

    const [data, total] = await Promise.all([
      prisma.examBank.findMany({
        where,
        include: { category: { select: { id: true, name: true } }, _count: { select: { files: true } } },
        orderBy: { title: "asc" },
        skip,
        take: limit,
      }),
      prisma.examBank.count({ where }),
    ])

    return NextResponse.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error("Get exam bank error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบ" }, { status: 500 })
  }
}
