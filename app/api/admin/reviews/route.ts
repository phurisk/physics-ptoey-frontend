import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "rating", "updatedAt"])

// GET: /api/admin/reviews - list all reviews with filters, for moderation
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const parsedPage = parseInt(searchParams.get("page") || "", 10)
    const parsedLimit = parseInt(searchParams.get("limit") || "", 10)
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10
    const skip = (page - 1) * limit

    const search = (searchParams.get("search") || "").trim()
    const rating = searchParams.get("rating") || "all"
    const targetType = searchParams.get("targetType") || "all" // all | course | ebook
    const courseId = searchParams.get("courseId") || ""
    const ebookId = searchParams.get("ebookId") || ""
    const isVerified = searchParams.get("isVerified") || "all"
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt"

    const where: Prisma.ReviewWhereInput = {}
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (rating !== "all") {
      const parsedRating = parseInt(rating, 10)
      if (Number.isFinite(parsedRating)) where.rating = parsedRating
    }
    if (targetType === "course") where.courseId = { not: null }
    else if (targetType === "ebook") where.ebookId = { not: null }
    if (courseId) where.courseId = courseId
    if (ebookId) where.ebookId = ebookId
    if (isVerified !== "all") where.isVerified = isVerified === "true"

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          course: { select: { id: true, title: true } },
          ebook: { select: { id: true, title: true } },
        },
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: { page, limit, total: totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get admin reviews error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว" }, { status: 500 })
  }
}
