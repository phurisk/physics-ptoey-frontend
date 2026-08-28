import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// POST: /api/reviews - create a review. userId is derived from the session
// (the tawan_dev reference trusted a client-supplied userId here — fixed).
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { courseId, ebookId, rating, title, comment, isActive } = body

    if (!courseId && !ebookId) {
      return NextResponse.json({ success: false, error: "Either courseId or ebookId is required" }, { status: 400 })
    }
    if (courseId && ebookId) {
      return NextResponse.json({ success: false, error: "Provide only one of courseId or ebookId" }, { status: 400 })
    }
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ success: false, error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    let isVerified = false
    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
      const enrollment = await prisma.enrollment.findFirst({ where: { userId: user.userId, courseId, status: "ACTIVE" } })
      isVerified = !!enrollment
    } else {
      const ebook = await prisma.ebook.findUnique({ where: { id: ebookId } })
      if (!ebook) return NextResponse.json({ success: false, error: "Ebook not found" }, { status: 404 })
      // Verified via OrderItem (the real purchase record), not the legacy
      // Order.ebookId field, which the checkout flow never populates.
      const purchased = await prisma.orderItem.findFirst({
        where: { itemType: "EBOOK", itemId: ebookId, order: { userId: user.userId, status: "COMPLETED" } },
      })
      isVerified = !!purchased
    }

    const review = await prisma.review.create({
      data: {
        userId: user.userId,
        courseId: courseId || null,
        ebookId: ebookId || null,
        rating: rating ?? 5,
        title: title || null,
        comment: comment || null,
        isActive: isActive ?? true,
        isVerified,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        ...(courseId ? { course: { select: { id: true, title: true } } } : { ebook: { select: { id: true, title: true, author: true } } }),
      },
    })

    return NextResponse.json({ success: true, data: { ...review, reviewType: courseId ? "course" : "ebook" }, message: "Review created" })
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } }
    if (err.code === "P2002") {
      const isCourse = err.meta?.target?.includes("courseId")
      return NextResponse.json(
        { success: false, error: isCourse ? "คุณได้รีวิวคอร์สนี้ไปแล้ว" : "คุณได้รีวิวหนังสือเล่มนี้ไปแล้ว" },
        { status: 409 }
      )
    }
    console.error("Create review error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างรีวิว" }, { status: 500 })
  }
}

// GET: /api/reviews - list reviews (public)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const ebookId = searchParams.get("ebookId")
    const userId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1") || 1
    const limit = parseInt(searchParams.get("limit") || "10") || 10
    const skip = (page - 1) * limit

    const where = {
      isActive: true,
      ...(courseId ? { courseId } : {}),
      ...(ebookId ? { ebookId } : {}),
      ...(userId ? { userId } : {}),
    }

    const [reviews, total, ratingGroups] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          ...(courseId ? { course: { select: { id: true, title: true } } } : {}),
          ...(ebookId ? { ebook: { select: { id: true, title: true, author: true } } } : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({ by: ["rating"], where, _count: { rating: true } }),
    ])

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let ratingSum = 0
    let ratingTotal = 0
    for (const g of ratingGroups) {
      ratingDistribution[g.rating] = g._count.rating
      ratingSum += g.rating * g._count.rating
      ratingTotal += g._count.rating
    }
    const averageRating = ratingTotal > 0 ? Math.round((ratingSum / ratingTotal) * 10) / 10 : 0

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: { totalReviews: ratingTotal, averageRating, ratingDistribution },
      },
    })
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว" }, { status: 500 })
  }
}
