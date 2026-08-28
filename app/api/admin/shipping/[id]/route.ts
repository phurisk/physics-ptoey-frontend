import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/shipping/[id] - update shipping status / tracking number
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.shipping.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบข้อมูลการจัดส่ง" }, { status: 404 })

    const shipping = await prisma.shipping.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        shippingMethod: body.shippingMethod ?? undefined,
        trackingNumber: body.trackingNumber !== undefined ? body.trackingNumber || null : undefined,
      },
      include: { order: { select: { id: true, orderNumber: true } } },
    })
    return NextResponse.json({ success: true, data: shipping })
  } catch (error) {
    console.error("Update shipping error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลการจัดส่ง" }, { status: 400 })
  }
}
