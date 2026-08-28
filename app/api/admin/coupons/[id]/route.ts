import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/coupons/[id] - get a single coupon
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        categories: true,
        items: true,
        _count: { select: { usages: true, orders: true } },
        usages: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            order: { select: { id: true, orderNumber: true, total: true } },
          },
          orderBy: { usedAt: "desc" },
          take: 20,
        },
      },
    })
    if (!coupon) return NextResponse.json({ success: false, error: "ไม่พบคูปอง" }, { status: 404 })

    return NextResponse.json({ success: true, data: { ...coupon, usedCount: coupon._count.usages, orderCount: coupon._count.orders } })
  } catch (error) {
    console.error("Get coupon error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคูปอง" }, { status: 500 })
  }
}

// PUT: /api/admin/coupons/[id] - update a coupon
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existingCoupon = await prisma.coupon.findUnique({ where: { id } })
    if (!existingCoupon) return NextResponse.json({ success: false, error: "ไม่พบคูปอง" }, { status: 404 })

    const code = body.code ? String(body.code).toUpperCase() : existingCoupon.code
    if (code !== existingCoupon.code) {
      const duplicate = await prisma.coupon.findUnique({ where: { code } })
      if (duplicate) return NextResponse.json({ success: false, error: "รหัสคูปองนี้มีอยู่แล้ว" }, { status: 400 })
    }

    const applicableType = body.applicableType || existingCoupon.applicableType
    const categoryIds: string[] = Array.isArray(body.categoryIds) ? body.categoryIds : []
    const specificItems: { itemType: string; itemId: string }[] = Array.isArray(body.specificItems) ? body.specificItems : []

    const coupon = await prisma.$transaction(async (tx) => {
      // Replace scoping rows to match the submitted applicableType/selection.
      await tx.couponCategory.deleteMany({ where: { couponId: id } })
      await tx.couponItem.deleteMany({ where: { couponId: id } })

      return tx.coupon.update({
        where: { id },
        data: {
          code,
          name: body.name ?? existingCoupon.name,
          description: body.description ?? null,
          type: body.type ?? existingCoupon.type,
          value: body.type === "FREE_SHIPPING" ? 0 : parseFloat(body.value) || 0,
          minOrderAmount: body.minOrderAmount === "" || body.minOrderAmount == null ? null : parseFloat(body.minOrderAmount),
          maxDiscount: body.maxDiscount === "" || body.maxDiscount == null ? null : parseFloat(body.maxDiscount),
          usageLimit: body.usageLimit === "" || body.usageLimit == null ? null : parseInt(body.usageLimit, 10),
          userUsageLimit: body.userUsageLimit === "" || body.userUsageLimit == null ? null : parseInt(body.userUsageLimit, 10),
          isActive: body.isActive !== undefined ? !!body.isActive : existingCoupon.isActive,
          validFrom: body.validFrom ? new Date(body.validFrom) : existingCoupon.validFrom,
          validUntil: body.validUntil ? new Date(body.validUntil) : existingCoupon.validUntil,
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
    })

    return NextResponse.json({ success: true, data: coupon, message: "แก้ไขคูปองสำเร็จ" })
  } catch (error) {
    console.error("Update coupon error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขคูปอง" }, { status: 400 })
  }
}

// DELETE: /api/admin/coupons/[id] - delete a coupon (blocked once it has been used)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id }, include: { usages: true } })
      if (!coupon) throw new Error("ไม่พบคูปอง")

      if (coupon.usages.length > 0) {
        throw new Error(`ไม่สามารถลบคูปองได้ เนื่องจากมีการใช้งานแล้ว ${coupon.usages.length} ครั้ง`)
      }

      await tx.couponCategory.deleteMany({ where: { couponId: id } })
      await tx.couponItem.deleteMany({ where: { couponId: id } })
      await tx.coupon.delete({ where: { id } })

      return { id: coupon.id, code: coupon.code }
    })

    return NextResponse.json({ success: true, message: "ลบคูปองสำเร็จ", data: result })
  } catch (error) {
    console.error("Delete coupon error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบคูปอง" },
      { status: 400 }
    )
  }
}
