import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// POST: /api/coupons/validate - preview a coupon's discount before checkout.
// userId is derived from the session (the tawan_dev reference this is ported
// from trusted a client-supplied userId here — fixed to match every other
// route's security posture).
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { code, itemType, itemId, subtotal } = body

    if (!code || subtotal == null) {
      return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code, isActive: true },
      include: { usages: { where: { userId: user.userId } }, categories: true, items: true },
    })
    if (!coupon) {
      return NextResponse.json({ success: false, error: "ไม่พบรหัสส่วนลดนี้" }, { status: 404 })
    }

    const now = new Date()
    if (now < coupon.validFrom) {
      return NextResponse.json({ success: false, error: "รหัสส่วนลดยังไม่เริ่มใช้งาน" }, { status: 400 })
    }
    if (now > coupon.validUntil) {
      return NextResponse.json({ success: false, error: "รหัสส่วนลดหมดอายุแล้ว" }, { status: 400 })
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: "รหัสส่วนลดถูกใช้หมดแล้ว" }, { status: 400 })
    }
    if (coupon.userUsageLimit && coupon.usages.length >= coupon.userUsageLimit) {
      return NextResponse.json({ success: false, error: "คุณใช้รหัสส่วนลดนี้ครบจำนวนแล้ว" }, { status: 400 })
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return NextResponse.json({ success: false, error: `ยอดขั้นต่ำสำหรับใช้รหัสนี้คือ ${coupon.minOrderAmount.toLocaleString()} บาท` }, { status: 400 })
    }
    if (coupon.applicableType === "COURSE_ONLY" && itemType !== "COURSE") {
      return NextResponse.json({ success: false, error: "รหัสส่วนลดนี้ใช้ได้เฉพาะคอร์สเรียน" }, { status: 400 })
    }
    if (coupon.applicableType === "EBOOK_ONLY" && itemType !== "EBOOK") {
      return NextResponse.json({ success: false, error: "รหัสส่วนลดนี้ใช้ได้เฉพาะหนังสือ" }, { status: 400 })
    }
    if (coupon.applicableType === "SPECIFIC_ITEM") {
      const matches = coupon.items.some((item) => item.itemId === itemId && item.itemType === itemType)
      if (!matches) {
        return NextResponse.json({ success: false, error: "รหัสส่วนลดนี้ใช้ไม่ได้กับสินค้านี้" }, { status: 400 })
      }
    }

    let discount = 0
    if (coupon.type === "PERCENTAGE") {
      discount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity)
    } else if (coupon.type === "FIXED_AMOUNT") {
      discount = Math.min(coupon.value, subtotal)
    } else if (coupon.type === "FREE_SHIPPING") {
      // shippingFee is always 0 in this checkout flow — free shipping has no monetary discount to give.
      discount = 0
    }

    const finalTotal = Math.max(0, Math.round((subtotal - discount) * 100) / 100)

    return NextResponse.json({
      success: true,
      data: {
        coupon: { id: coupon.id, code: coupon.code, name: coupon.name, type: coupon.type, value: coupon.value },
        discount: Math.round(discount * 100) / 100,
        finalTotal,
      },
    })
  } catch (error) {
    console.error("Validate coupon error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสส่วนลด" }, { status: 500 })
  }
}
