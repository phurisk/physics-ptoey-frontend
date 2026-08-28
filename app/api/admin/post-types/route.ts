import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/post-types - list post types with search + pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()
    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize
    const status = searchParams.get("status") || "ALL"
    const sortBy = searchParams.get("sortBy") || "name"
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc"

    const where: Prisma.PostTypeWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status === "ACTIVE") where.isActive = true
    else if (status === "INACTIVE") where.isActive = false

    const [totalCount, postTypes] = await Promise.all([
      prisma.postType.count({ where }),
      prisma.postType.findMany({
        where,
        include: { _count: { select: { posts: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: postTypes,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get post types error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลประเภทบทความ" }, { status: 500 })
  }
}

// POST: /api/admin/post-types - create a post type
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ success: false, error: "กรุณากรอกชื่อประเภทบทความ" }, { status: 400 })
    }

    const postType = await prisma.postType.create({
      data: {
        name: body.name,
        description: body.description || null,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ success: true, data: postType })
  } catch (error: unknown) {
    console.error("Create post type error:", error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "มีประเภทบทความชื่อนี้อยู่แล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างประเภทบทความ" }, { status: 400 })
  }
}
