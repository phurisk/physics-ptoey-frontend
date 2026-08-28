import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// GET: /api/courses - published courses, public
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1") || 1
    const limit = parseInt(searchParams.get("limit") || "12") || 12
    const isRecommended = searchParams.get("isRecommended")
    const categoryId = searchParams.get("categoryId")
    const subject = searchParams.get("subject")
    const gradeLevel = searchParams.get("gradeLevel")
    const skip = (page - 1) * limit

    const where: Prisma.CourseWhereInput = { status: "PUBLISHED" }
    if (isRecommended === "true") where.isRecommended = true
    else if (isRecommended === "false") where.isRecommended = false
    if (categoryId) where.categoryId = categoryId
    if (subject) where.subject = subject as Prisma.CourseWhereInput["subject"]
    if (gradeLevel) where.gradeLevel = gradeLevel as Prisma.CourseWhereInput["gradeLevel"]

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          discountPrice: true,
          sampleVideo: true,
          duration: true,
          accessDuration: true,
          accessHours: true,
          isFree: true,
          isRecommended: true,
          status: true,
          subject: true,
          gradeLevel: true,
          coverImageUrl: true,
          coverPublicId: true,
          isPhysical: true,
          weight: true,
          dimensions: true,
          createdAt: true,
          updatedAt: true,
          instructor: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true, description: true } },
          _count: { select: { enrollments: true, chapters: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอร์ส" }, { status: 500 })
  }
}
