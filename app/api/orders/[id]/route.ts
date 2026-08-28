import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/orders/[id] - single order detail (owner or admin only)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } }, payment: true, shipping: true, items: true },
    })

    if (!order) return NextResponse.json({ success: false, error: "ไม่พบคำสั่งซื้อ" }, { status: 404 })
    if (order.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Get order error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ" }, { status: 500 })
  }
}
