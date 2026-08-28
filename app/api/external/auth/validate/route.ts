import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyExternalToken } from "@/lib/jwt"

// POST: /api/external/auth/validate - verify a JWT and return fresh user +
// permissions. canDownloadEbooks is derived from OrderItem (the real
// purchase record) rather than the legacy Order.orderType field the
// reference implementation read (which the checkout flow never populates).
export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ valid: false, message: "Missing token" }, { status: 400 })

    const verification = verifyExternalToken(token)
    if (!verification.valid) return NextResponse.json({ valid: false, message: "Invalid token" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: verification.data.userId } })
    if (!user) return NextResponse.json({ valid: false, message: "User not found" }, { status: 404 })

    const [enrollments, orders, ebookPurchaseCount] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: { select: { id: true, title: true } } } }),
      prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.orderItem.count({ where: { itemType: "EBOOK", order: { userId: user.id, status: "COMPLETED" } } }),
    ])

    return NextResponse.json({
      valid: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, lineId: user.lineId },
        permissions: {
          canAccessCourses: enrollments.length > 0,
          canDownloadEbooks: ebookPurchaseCount > 0,
          isAdmin: user.role === "ADMIN",
        },
        stats: { enrollments, recentOrders: orders },
      },
    })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 })
  }
}
