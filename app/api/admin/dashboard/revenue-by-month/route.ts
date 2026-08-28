import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/dashboard/revenue-by-month - completed-order revenue for the last 6 months
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const months: { key: string; label: string; start: Date; end: Date }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      months.push({
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
        label: start.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
        start,
        end,
      })
    }

    const orders = await prisma.order.findMany({
      where: { status: "COMPLETED", createdAt: { gte: months[0].start } },
      select: { total: true, createdAt: true },
    })

    const data = months.map(({ key, label, start, end }) => {
      const revenue = orders
        .filter((o) => o.createdAt >= start && o.createdAt < end)
        .reduce((sum, o) => sum + o.total, 0)
      return { key, label, revenue }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Get revenue-by-month error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลยอดขาย" }, { status: 500 })
  }
}
