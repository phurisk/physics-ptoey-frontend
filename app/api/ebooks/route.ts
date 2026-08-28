import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// Public, non-personalized listing — same response for every visitor.
export const revalidate = 86400 // 1 day

// GET: /api/ebooks - active ebooks, public
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get("category")
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")
    const format = searchParams.get("format")
    const page = parseInt(searchParams.get("page") || "1") || 1
    const limit = parseInt(searchParams.get("limit") || "12") || 12
    const skip = (page - 1) * limit

    const where: Prisma.EbookWhereInput = { isActive: true }
    if (categorySlug) where.category = { slug: categorySlug }
    if (featured === "true") where.isFeatured = true
    if (format) where.format = format as Prisma.EbookWhereInput["format"]
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [ebooks, total] = await Promise.all([
      prisma.ebook.findMany({
        where,
        include: { category: true, reviews: { select: { rating: true } } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.ebook.count({ where }),
    ])

    const data = ebooks.map((ebook) => {
      const averageRating = ebook.reviews.length > 0 ? ebook.reviews.reduce((s, r) => s + r.rating, 0) / ebook.reviews.length : 0
      const { reviews, ...rest } = ebook
      return { ...rest, fileUrl: undefined, averageRating, _count: { reviews: reviews.length } }
    })

    return NextResponse.json(
      { success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
    )
  } catch (error) {
    console.error("Get ebooks error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลอีบุ๊ก", details: error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}
