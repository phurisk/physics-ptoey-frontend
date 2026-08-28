import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/dashboard/stats - top-line counts + revenue + recent orders
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      activeEnrollments,
      totalOrders,
      pendingOrders,
      revenueAgg,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "PENDING_PAYMENT", "PENDING_VERIFICATION"] } } }),
      prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } }, payment: { select: { status: true } } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        publishedCourses,
        activeEnrollments,
        totalOrders,
        pendingOrders,
        totalRevenue: revenueAgg._sum.total ?? 0,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          userName: o.user?.name || o.user?.email || "-",
          total: o.total,
          status: o.status,
          paymentStatus: o.payment?.status ?? null,
          createdAt: o.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด" }, { status: 500 })
  }
}
