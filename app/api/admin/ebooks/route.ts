import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/ebooks - list ebooks with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const status = searchParams.get("status") || "ALL"
    const format = searchParams.get("format") || ""
    const featured = searchParams.get("featured") || "ALL"
    const physical = searchParams.get("physical") || "ALL"
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.EbookWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (status !== "ALL") where.isActive = status === "ACTIVE"
    if (format) where.format = format as Prisma.EbookWhereInput["format"]
    if (featured !== "ALL") where.isFeatured = featured === "FEATURED"
    if (physical !== "ALL") where.isPhysical = physical === "PHYSICAL"
    if (minPrice !== null || maxPrice !== null) {
      where.price = {}
      if (minPrice !== null && minPrice !== "") where.price.gte = parseFloat(minPrice)
      if (maxPrice !== null && maxPrice !== "") where.price.lte = parseFloat(maxPrice)
    }

    let orderBy: Prisma.EbookOrderByWithRelationInput = {}
    if (sortBy === "category") orderBy = { category: { name: sortOrder } }
    else orderBy = { [sortBy]: sortOrder }

    const [totalCount, ebooks] = await Promise.all([
      prisma.ebook.count({ where }),
      prisma.ebook.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { reviews: true, downloads: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: ebooks,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get ebooks error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลอีบุ๊ก" }, { status: 500 })
  }
}

// POST: /api/admin/ebooks - create an ebook
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title || !body.author) {
      return NextResponse.json({ success: false, error: "กรุณากรอกชื่อหนังสือและผู้เขียน" }, { status: 400 })
    }

    const ebook = await prisma.ebook.create({
      data: {
        title: body.title,
        description: body.description || null,
        author: body.author,
        isbn: body.isbn || null,
        price: parseFloat(body.price) || 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        coverImageUrl: body.coverImageUrl || null,
        previewUrl: body.previewUrl || null,
        fileUrl: body.fileUrl || null,
        fileSize: body.fileSize ? parseInt(body.fileSize) : null,
        pageCount: body.pageCount ? parseInt(body.pageCount) : null,
        language: body.language || "th",
        format: body.format || "PDF",
        isPhysical: !!body.isPhysical,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions || null,
        downloadLimit: body.downloadLimit ? parseInt(body.downloadLimit) : null,
        accessDuration: body.accessDuration ? parseInt(body.accessDuration) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        isFeatured: !!body.isFeatured,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        publishedYear: body.publishedYear ? parseInt(body.publishedYear) : null,
        categoryId: body.categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ success: true, data: ebook })
  } catch (error) {
    console.error("Create ebook error:", error)
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, error: "ISBN นี้มีอยู่แล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างอีบุ๊ก" }, { status: 400 })
  }
}
