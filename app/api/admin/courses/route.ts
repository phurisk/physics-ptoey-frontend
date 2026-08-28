import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/courses - list courses with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const instructorId = searchParams.get("instructorId") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const subject = searchParams.get("subject") || ""
    const gradeLevel = searchParams.get("gradeLevel") || ""
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.CourseWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status && status !== "ALL") {
      where.status = status === "ACTIVE" ? { not: "DELETED" } : (status as Prisma.EnumCourseStatusFilter["equals"])
    }
    if (instructorId) where.instructorId = instructorId
    if (categoryId) where.categoryId = categoryId
    if (subject) where.subject = subject as Prisma.CourseWhereInput["subject"]
    if (gradeLevel) where.gradeLevel = gradeLevel as Prisma.CourseWhereInput["gradeLevel"]
    if (minPrice !== null || maxPrice !== null) {
      where.price = {}
      if (minPrice !== null && minPrice !== "") where.price.gte = parseFloat(minPrice)
      if (maxPrice !== null && maxPrice !== "") where.price.lte = parseFloat(maxPrice)
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = {}
    if (sortBy === "instructor") orderBy = { instructor: { name: sortOrder } }
    else if (sortBy === "category") orderBy = { category: { name: sortOrder } }
    else orderBy = { [sortBy]: sortOrder }

    const [totalCount, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        include: {
          instructor: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, chapters: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอร์ส" }, { status: 500 })
  }
}

// POST: /api/admin/courses - create a course
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title || !body.instructorId || !body.status) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        price: parseFloat(body.price) || 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        sampleVideo: body.sampleVideo,
        duration: body.duration,
        accessDuration: body.accessDuration,
        accessHours: body.accessHours,
        isFree: !!body.isFree,
        isRecommended: !!body.isRecommended,
        status: body.status,
        instructorId: body.instructorId,
        categoryId: body.categoryId || null,
        subject: body.subject || null,
        gradeLevel: body.gradeLevel || null,
        coverImageUrl: body.coverImageUrl,
        coverPublicId: body.coverPublicId,
        isPhysical: !!body.isPhysical,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
      },
    })
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างคอร์ส" }, { status: 400 })
  }
}
