import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/coupons - list coupons with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const applicableType = searchParams.get("applicableType") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.CouponWhereInput = {}
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (type) where.type = type as Prisma.CouponWhereInput["type"]
    if (status === "active") where.isActive = true
    else if (status === "inactive") where.isActive = false
    if (applicableType) where.applicableType = applicableType as Prisma.CouponWhereInput["applicableType"]

    const orderBy: Prisma.CouponOrderByWithRelationInput = { [sortBy]: sortOrder }

    const [totalCount, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        include: { _count: { select: { usages: true, orders: true } } },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const now = new Date()
    const data = coupons.map((coupon) => ({
      ...coupon,
      usedCount: coupon._count.usages,
      orderCount: coupon._count.orders,
      usagePercentage: coupon.usageLimit ? Math.round((coupon._count.usages / coupon.usageLimit) * 100) : 0,
      isExpired: now > coupon.validUntil,
      daysLeft: Math.max(0, Math.ceil((coupon.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
    }))

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get coupons error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคูปอง" }, { status: 500 })
  }
}

// POST: /api/admin/coupons - create a coupon
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.code || !body.name || !body.type || !body.validFrom || !body.validUntil) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const code = String(body.code).toUpperCase()

    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ success: false, error: "รหัสคูปองนี้มีอยู่แล้ว" }, { status: 400 })
    }

    const applicableType = body.applicableType || "ALL"
    const categoryIds: string[] = Array.isArray(body.categoryIds) ? body.categoryIds : []
    const specificItems: { itemType: string; itemId: string }[] = Array.isArray(body.specificItems) ? body.specificItems : []

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name: body.name,
        description: body.description || null,
        type: body.type,
        value: body.type === "FREE_SHIPPING" ? 0 : parseFloat(body.value) || 0,
        minOrderAmount: body.minOrderAmount === "" || body.minOrderAmount == null ? null : parseFloat(body.minOrderAmount),
        maxDiscount: body.maxDiscount === "" || body.maxDiscount == null ? null : parseFloat(body.maxDiscount),
        usageLimit: body.usageLimit === "" || body.usageLimit == null ? null : parseInt(body.usageLimit, 10),
        userUsageLimit: body.userUsageLimit === "" || body.userUsageLimit == null ? null : parseInt(body.userUsageLimit, 10),
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        applicableType,
        ...(applicableType === "CATEGORY" && categoryIds.length > 0
          ? { categories: { create: categoryIds.map((categoryId) => ({ categoryId })) } }
          : {}),
        ...(applicableType === "SPECIFIC_ITEM" && specificItems.length > 0
          ? { items: { create: specificItems.map((item) => ({ itemType: item.itemType as "COURSE" | "EBOOK", itemId: item.itemId })) } }
          : {}),
      },
      include: { categories: true, items: true },
    })

    return NextResponse.json({ success: true, data: coupon, message: "สร้างคูปองสำเร็จ" })
  } catch (error) {
    console.error("Create coupon error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างคูปอง" }, { status: 400 })
  }
}
