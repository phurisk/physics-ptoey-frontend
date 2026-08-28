import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "name", "email", "role", "lineId", "updatedAt"])

// GET: /api/admin/users - list users with filtering and pagination
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)

    const parsedPage = parseInt(searchParams.get("page") || "", 10)
    const parsedLimit = parseInt(searchParams.get("limit") || "", 10)
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10
    const search = (searchParams.get("search") || "").trim()
    const role = searchParams.get("role") || "all"
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"
    const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt"

    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { lineId: { contains: search, mode: "insensitive" } },
      ]
    }
    if (role !== "all") where.role = role as Prisma.EnumRoleFilter["equals"]

    const [users, totalCount, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          lineId: true,
          school: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { orders: true, courses: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    ])

    const stats = { total: 0, students: 0, instructors: 0, admins: 0 }
    for (const row of roleCounts) {
      stats.total += row._count._all
      if (row.role === "STUDENT") stats.students = row._count._all
      else if (row.role === "INSTRUCTOR") stats.instructors = row._count._all
      else if (row.role === "ADMIN") stats.admins = row._count._all
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total: totalCount, pages: totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        total: totalCount,
        stats,
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" }, { status: 500 })
  }
}

// POST: /api/admin/users - create a user
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { name, email, role, password, lineId, image } = body

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, อีเมล, รหัสผ่าน)" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return NextResponse.json({ success: false, error: "อีเมลนี้ได้ถูกใช้งานแล้ว" }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, role: role || "STUDENT", password: hashedPassword, lineId, image },
      select: { id: true, name: true, email: true, image: true, role: true, lineId: true, createdAt: true },
    })

    return NextResponse.json({ success: true, data: user, message: "สร้างผู้ใช้สำเร็จ" })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" }, { status: 500 })
  }
}
