import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { grantEntitlementsForOrder } from "@/lib/grantOrderEntitlements"

type BulkAction = "APPROVE_PAYMENT" | "REJECT_PAYMENT"

// POST: /api/admin/orders/bulk - apply APPROVE_PAYMENT/REJECT_PAYMENT to many
// orders at once (same per-order rules as PATCH /api/admin/orders/[id], just
// looped — orders with no payment or an already-COMPLETED payment are
// skipped rather than failing the whole batch).
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const orderIds = body?.orderIds as string[]
    const action = body?.action as BulkAction

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: "orderIds is required" }, { status: 400 })
    }
    if (action !== "APPROVE_PAYMENT" && action !== "REJECT_PAYMENT") {
      return NextResponse.json({ success: false, error: "action must be APPROVE_PAYMENT or REJECT_PAYMENT" }, { status: 400 })
    }

    const orders = await prisma.order.findMany({ where: { id: { in: orderIds } }, include: { payment: true } })

    const succeeded: string[] = []
    const skipped: { id: string; reason: string }[] = []

    for (const order of orders) {
      if (!order.payment) {
        skipped.push({ id: order.id, reason: "ไม่พบข้อมูลการชำระเงิน" })
        continue
      }
      if (order.payment.status === "COMPLETED") {
        skipped.push({ id: order.id, reason: "อนุมัติแล้ว" })
        continue
      }

      if (action === "APPROVE_PAYMENT") {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: "COMPLETED", verifiedAt: new Date(), paidAt: order.payment.paidAt ?? new Date() },
        })
        await prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } })
        await grantEntitlementsForOrder(order.id)
      } else {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: "REJECTED", verifiedAt: new Date(), notes: "ปฏิเสธการชำระเงิน (bulk) - หลักฐานไม่ถูกต้องหรือไม่ชัดเจน" },
        })
      }
      succeeded.push(order.id)
    }

    return NextResponse.json({
      success: true,
      message: `ดำเนินการสำเร็จ ${succeeded.length} รายการ${skipped.length ? ` (ข้าม ${skipped.length} รายการ)` : ""}`,
      data: { succeeded, skipped },
    })
  } catch (error) {
    console.error("Bulk update orders error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดำเนินการแบบกลุ่ม" }, { status: 500 })
  }
}
