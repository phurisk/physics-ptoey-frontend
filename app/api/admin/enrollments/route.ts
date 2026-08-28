import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

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
