import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

// Public, non-personalized data (same response for every visitor) — every
// homepage section (hero banner, articles, reviews, etc.) hits this with a
// different postType, so caching it directly cuts out most of the
// homepage's DB round-trips.
export const revalidate = 86400 // 1 day

// GET: /api/posts - published articles/blog posts, public, no pagination (capped take)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const postType = searchParams.get("postType")
    const featured = searchParams.get("featured")
    const limitParam = parseInt(searchParams.get("limit") || "")
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT

    const posts = await prisma.post.findMany({
      where: {
        isActive: true,
        publishedAt: { lte: new Date(), not: null },
        postType: { isActive: true, ...(postType ? { name: postType } : {}) },
        ...(featured === "true" ? { isFeatured: true } : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        postType: { select: { id: true, name: true, description: true } },
        postContents: {
          select: { id: true, urlImg: true, name: true, description: true, createdAt: true, author: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    })

    return NextResponse.json(
      { success: true, message: "OK", count: posts.length, data: posts },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
    )
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลบทความ", count: 0, data: [] }, { status: 500 })
  }
}
