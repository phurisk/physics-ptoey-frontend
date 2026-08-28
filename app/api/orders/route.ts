import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { grantEntitlementsForOrder } from "@/lib/grantOrderEntitlements"

type CheckoutItem = {
  itemType: "COURSE" | "EBOOK" | "MOCK_EXAM"
  itemId: string
  title?: string
  quantity?: number
}

// POST: /api/orders - create an order from a list of items (the core checkout flow)
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { items, couponCode, shippingAddress, school } = body as {
      items: CheckoutItem[]
      couponCode?: string
      shippingAddress?: { name?: string; phone?: string; address?: string; district?: string; province?: string; postalCode?: string }
      school?: string
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
    if (!dbUser) return NextResponse.json({ success: false, error: "ไม่พบผู้ใช้" }, { status: 404 })

    // One-time school capture — required before the first order if not already on file.
    let schoolToPersist: string | undefined
    if (!dbUser.school) {
      const trimmedSchool = school?.trim()
      if (!trimmedSchool) {
        return NextResponse.json({ success: false, error: "กรุณากรอกชื่อโรงเรียน" }, { status: 400 })
      }
      schoolToPersist = trimmedSchool
    }

    let subtotal = 0
    let hasPhysical = false
    const orderItemsData: { itemType: "COURSE" | "EBOOK" | "MOCK_EXAM"; itemId: string; title: string; quantity: number; unitPrice: number; totalPrice: number }[] = []

    for (const item of items) {
      const quantity = item.quantity ?? 1
      let itemData: { title?: string; price: number; discountPrice?: number | null; isPhysical?: boolean } | null = null

      if (item.itemType === "COURSE") {
        itemData = await prisma.course.findUnique({ where: { id: item.itemId, status: "PUBLISHED" } })
      } else if (item.itemType === "EBOOK") {
        itemData = await prisma.ebook.findUnique({ where: { id: item.itemId, isActive: true } })
      } else if (item.itemType === "MOCK_EXAM") {
        itemData = await prisma.mockExam.findUnique({ where: { id: item.itemId, isActive: true } })
      }

      if (!itemData) {
        return NextResponse.json({ success: false, error: `ไม่พบสินค้า ${item.itemId}` }, { status: 404 })
      }

      const alreadyPurchased = await prisma.orderItem.findFirst({
        where: { itemType: item.itemType, itemId: item.itemId, order: { userId: user.userId, status: "COMPLETED" } },
      })
      if (alreadyPurchased) {
        return NextResponse.json({ success: false, error: `คุณได้ซื้อสินค้านี้แล้ว (${item.itemId})` }, { status: 400 })
      }

      const price = itemData.discountPrice || itemData.price || 0
      subtotal += price * quantity
      orderItemsData.push({
        itemType: item.itemType,
        itemId: item.itemId,
        title: item.title || itemData.title || "",
        quantity,
        unitPrice: price,
        totalPrice: price * quantity,
      })
      if (itemData.isPhysical) hasPhysical = true
    }

    const shippingFee = 0 // no shipping fee in this flow, by design
    let couponDiscount = 0
    let matchedCoupon: { id: string } | null = null

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, isActive: true },
        include: { usages: { where: { userId: user.userId } } },
      })
      const now = new Date()
      const isValid =
        coupon &&
        now >= coupon.validFrom &&
        now <= coupon.validUntil &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
        (!coupon.userUsageLimit || coupon.usages.length < coupon.userUsageLimit) &&
        (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)

      if (isValid && coupon) {
        matchedCoupon = coupon
        if (coupon.type === "PERCENTAGE") couponDiscount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity)
        else if (coupon.type === "FIXED_AMOUNT") couponDiscount = Math.min(coupon.value, subtotal)
        else if (coupon.type === "FREE_SHIPPING") couponDiscount = shippingFee
      }
      // Invalid coupon at checkout time is silently ignored (no discount, no error) — the
      // frontend should already have validated it via /api/coupons/validate beforehand.
    }

    const total = subtotal + shippingFee - couponDiscount
    const isFree = total === 0

    const order = await prisma.order.create({
      data: {
        userId: user.userId,
        status: isFree ? "COMPLETED" : "PENDING",
        subtotal,
        shippingFee,
        couponDiscount,
        total,
        couponId: matchedCoupon?.id,
        couponCode: matchedCoupon ? couponCode : undefined,
        items: { create: orderItemsData },
      },
    })

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: isFree ? "FREE" : "BANK_TRANSFER",
        status: isFree ? "COMPLETED" : "PENDING",
        amount: total,
        paidAt: isFree ? new Date() : undefined,
        ref: isFree ? `FREE${Date.now()}` : `ORD${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      },
    })

    if (schoolToPersist) {
      await prisma.user.update({ where: { id: user.userId }, data: { school: schoolToPersist } })
    }

    try {
      await prisma.$transaction(
        orderItemsData.map((item) => prisma.cartItem.deleteMany({ where: { itemType: item.itemType, itemId: item.itemId, cart: { userId: user.userId } } }))
      )
    } catch (cartError) {
      console.error("Failed to clear cart items after order:", cartError)
    }

    if (isFree) {
      await grantEntitlementsForOrder(order.id)
    }

    if (matchedCoupon) {
      await prisma.coupon.update({ where: { id: matchedCoupon.id }, data: { usageCount: { increment: 1 } } })
      await prisma.couponUsage.create({ data: { couponId: matchedCoupon.id, userId: user.userId, orderId: order.id } })
    }

    if (hasPhysical && shippingAddress) {
      await prisma.shipping.create({
        data: {
          orderId: order.id,
          name: shippingAddress.name || dbUser.name || dbUser.email || "",
          phone: shippingAddress.phone || "",
          address: shippingAddress.address || "",
          district: shippingAddress.district || "",
          province: shippingAddress.province || "",
          postalCode: shippingAddress.postalCode || "",
          shippingMethod: "STANDARD",
          status: "PENDING",
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: isFree ? "ลงทะเบียนฟรีสำเร็จ" : "สร้างคำสั่งซื้อสำเร็จ",
      data: { orderId: order.id, isFree, total },
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" }, { status: 500 })
  }
}

// GET: /api/orders - current user's orders
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: { payment: true, shipping: true, items: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ" }, { status: 500 })
  }
}
