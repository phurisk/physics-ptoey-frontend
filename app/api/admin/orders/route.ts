import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/orders - list orders with server-side filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const skip = (page - 1) * pageSize

    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const paymentStatus = searchParams.get("paymentStatus") || ""
    const orderType = searchParams.get("orderType") || ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.OrderWhereInput = {}
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ]
    }
    if (status && status !== "ALL") {
      where.status = status as Prisma.EnumOrderStatusFilter["equals"]
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      where.payment = { status: paymentStatus as Prisma.EnumPaymentStatusFilter["equals"] }
    }
    if (orderType && orderType !== "ALL") {
      where.items = { some: { itemType: orderType as Prisma.EnumItemTypeFilter["equals"] } }
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    let orderBy: Prisma.OrderOrderByWithRelationInput = {}
    if (sortBy === "customer") orderBy = { user: { name: sortOrder } }
    else if (sortBy === "total" || sortBy === "status" || sortBy === "createdAt" || sortBy === "orderNumber") {
      orderBy = { [sortBy]: sortOrder }
    } else {
      orderBy = { createdAt: sortOrder }
    }

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payment: true,
          shipping: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, pageSize, totalCount, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    })
  } catch (error) {
    console.error("Get admin orders error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ" }, { status: 500 })
  }
}
