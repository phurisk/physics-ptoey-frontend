import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/shipping - list shipments
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const shippingMethod = searchParams.get("shippingMethod") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.ShippingWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (status && status !== "ALL") where.status = status as Prisma.ShippingWhereInput["status"]
    if (shippingMethod && shippingMethod !== "ALL") where.shippingMethod = shippingMethod as Prisma.ShippingWhereInput["shippingMethod"]

    const [totalCount, shipments] = await Promise.all([
      prisma.shipping.count({ where }),
      prisma.shipping.findMany({
        where,
        include: { order: { select: { id: true, orderNumber: true, user: { select: { name: true, email: true } } } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: shipments,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (error) {
    console.error("Get shipping error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลการจัดส่ง" }, { status: 500 })
  }
}
