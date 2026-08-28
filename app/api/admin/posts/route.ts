import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/posts - list posts with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const postTypeId = searchParams.get("postTypeId") || ""
    const isActive = searchParams.get("isActive") || ""
    const isFeatured = searchParams.get("isFeatured") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.PostWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ]
    }
    if (postTypeId) where.postTypeId = postTypeId
    if (isActive === "true") where.isActive = true
    else if (isActive === "false") where.isActive = false
    if (isFeatured === "true") where.isFeatured = true

    let orderBy: Prisma.PostOrderByWithRelationInput = {}
    if (sortBy === "author") orderBy = { author: { name: sortOrder } }
    else if (sortBy === "postType") orderBy = { postType: { name: sortOrder } }
    else orderBy = { [sortBy]: sortOrder }

    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          postType: { select: { id: true, name: true } },
          _count: { select: { postContents: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลบทความ" }, { status: 500 })
  }
}

// POST: /api/admin/posts - create a post (author is the current admin session user)
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title || !body.postTypeId) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content || null,
        excerpt: body.excerpt || null,
        imageUrl: body.imageUrl || null,
        imageUrlMobileMode: body.imageUrlMobileMode || null,
        slug: body.slug || null,
        isActive: body.isActive ?? true,
        isFeatured: !!body.isFeatured,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        postTypeId: body.postTypeId,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        postType: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ success: true, data: post })
  } catch (error: unknown) {
    console.error("Create post error:", error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "มี slug นี้ถูกใช้งานแล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างบทความ" }, { status: 400 })
  }
}
