import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { grantEntitlementsForOrder } from "@/lib/grantOrderEntitlements"
import type { Prisma } from "@prisma/client"

const ORDER_DETAIL_INCLUDE = {
  user: { select: { id: true, name: true, email: true, school: true, lineId: true, image: true } },
  items: true,
  payment: true,
  shipping: true,
  coupon: { select: { id: true, code: true, name: true, type: true, value: true } },
} satisfies Prisma.OrderInclude

// GET: /api/admin/orders/[id] - full order detail for the admin review screen
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const order = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE })
    if (!order) return NextResponse.json({ success: false, error: "ไม่พบคำสั่งซื้อ" }, { status: 404 })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Get admin order detail error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ" }, { status: 500 })
  }
}

type PatchBody = {
  action: "APPROVE_PAYMENT" | "REJECT_PAYMENT" | "UPDATE_SHIPPING"
  notes?: string
  shippingStatus?: string
  trackingNumber?: string
}

// PATCH: /api/admin/orders/[id] - admin review actions:
// - APPROVE_PAYMENT: mark the payment COMPLETED, complete the order, grant entitlements
//   (same lib/grantOrderEntitlements.ts entrypoint the auto-approval slip-upload flow uses)
// - REJECT_PAYMENT: mark the payment REJECTED; the order itself stays unpaid so the
//   customer can re-upload a slip (deliberately not force-cancelling the order here)
// - UPDATE_SHIPPING: update tracking number / shipping status for physical orders
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = (await req.json()) as PatchBody
    const { action, notes, shippingStatus, trackingNumber } = body

    const order = await prisma.order.findUnique({ where: { id }, include: { payment: true, shipping: true, user: true } })
    if (!order) return NextResponse.json({ success: false, error: "ไม่พบคำสั่งซื้อ" }, { status: 404 })

    if (action === "APPROVE_PAYMENT") {
      if (!order.payment) {
        return NextResponse.json({ success: false, error: "ไม่พบข้อมูลการชำระเงิน" }, { status: 404 })
      }
      if (order.payment.status === "COMPLETED") {
        return NextResponse.json({ success: false, error: "การชำระเงินนี้ได้รับการอนุมัติแล้ว" }, { status: 400 })
      }

      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "COMPLETED",
          verifiedAt: new Date(),
          paidAt: order.payment.paidAt ?? new Date(),
          notes: notes ?? order.payment.notes,
        },
      })
      await prisma.order.update({ where: { id }, data: { status: "COMPLETED" } })
      await grantEntitlementsForOrder(id)

      const updated = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE })
      return NextResponse.json({ success: true, message: "อนุมัติการชำระเงินสำเร็จ", data: updated })
    }

    if (action === "REJECT_PAYMENT") {
      if (!order.payment) {
        return NextResponse.json({ success: false, error: "ไม่พบข้อมูลการชำระเงิน" }, { status: 404 })
      }
      if (order.payment.status === "COMPLETED") {
        return NextResponse.json({ success: false, error: "การชำระเงินนี้ได้รับการอนุมัติแล้ว ไม่สามารถปฏิเสธได้" }, { status: 400 })
      }

      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "REJECTED",
          verifiedAt: new Date(),
          notes: notes || "ปฏิเสธการชำระเงิน - หลักฐานไม่ถูกต้องหรือไม่ชัดเจน",
        },
      })
      // Order.status intentionally left as-is (still unpaid) — no auto-cancel, so the
      // customer can re-upload a corrected slip against the same order.

      const updated = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE })
      return NextResponse.json({ success: true, message: "ปฏิเสธการชำระเงินแล้ว", data: updated })
    }

    if (action === "UPDATE_SHIPPING") {
      if (!order.shipping) {
        return NextResponse.json({ success: false, error: "คำสั่งซื้อนี้ไม่มีข้อมูลการจัดส่ง" }, { status: 404 })
      }

      const data: Prisma.ShippingUpdateInput = {}
      if (shippingStatus) data.status = shippingStatus as Prisma.EnumShippingStatusFieldUpdateOperationsInput["set"]
      if (trackingNumber !== undefined) data.trackingNumber = trackingNumber

      await prisma.shipping.update({ where: { id: order.shipping.id }, data })

      const updated = await prisma.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE })
      return NextResponse.json({ success: true, message: "อัปเดตข้อมูลการจัดส่งสำเร็จ", data: updated })
    }

    return NextResponse.json({ success: false, error: "ไม่รู้จักการดำเนินการนี้" }, { status: 400 })
  } catch (error) {
    console.error("Update admin order error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ" }, { status: 500 })
  }
}
