import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { Prisma } from "@prisma/client"

// GET: /api/admin/enrollments - list enrollments with server-side filtering and pagination
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
    const courseId = searchParams.get("courseId") || ""
    const sortBy = searchParams.get("sortBy") || "enrolledAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.EnrollmentWhereInput = {}
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { course: { title: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (status && status !== "ALL") where.status = status as Prisma.EnrollmentWhereInput["status"]
    if (courseId) where.courseId = courseId

    let orderBy: Prisma.EnrollmentOrderByWithRelationInput = {}
    if (sortBy === "user") orderBy = { user: { name: sortOrder } }
    else if (sortBy === "course") orderBy = { course: { title: sortOrder } }
    else orderBy = { [sortBy]: sortOrder }

    const [totalCount, enrollments] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, accessDuration: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: enrollments,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get enrollments error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลการลงทะเบียน" }, { status: 500 })
  }
}

// POST: /api/admin/enrollments - manually grant one or more courses to a user
// (bypassing checkout), e.g. from the "grant course" action on the users page.
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { userId, courseIds, accessDuration, accessHours } = await req.json()
    if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ success: false, error: "ต้องระบุ userId และ courseIds" }, { status: 400 })
    }

    const courses = await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } })
    const foundIds = new Set(courses.map((c) => c.id))
    const missingIds = courseIds.filter((id: string) => !foundIds.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json({ success: false, error: `ไม่พบคอร์สบางรายการ: ${missingIds.join(", ")}` }, { status: 404 })
    }

    const granted: string[] = []
    const alreadyEnrolled: string[] = []

    for (const course of courses) {
      try {
        await prisma.enrollment.create({
          data: {
            userId,
            courseId: course.id,
            progress: 0,
            status: "ACTIVE",
            accessDuration: accessDuration ?? null,
            accessHours: accessHours ?? null,
          },
        })
        granted.push(course.title)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          alreadyEnrolled.push(course.title)
        } else {
          throw error
        }
      }
    }

    return NextResponse.json({ success: true, granted, alreadyEnrolled })
  } catch (error) {
    console.error("Grant course access error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการเพิ่มคอร์ส" }, { status: 500 })
  }
}
