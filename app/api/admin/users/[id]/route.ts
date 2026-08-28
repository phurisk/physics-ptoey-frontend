import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/users/[id] - get a single user with purchase/enrollment counts
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
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
        _count: { select: { orders: true, enrollments: true, courses: true, reviews: true } },
      },
    })
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" }, { status: 500 })
  }
}

// PUT: /api/admin/users/[id] - update a user's profile/role. Password is left
// untouched unless a new one is explicitly provided in the body.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { name, email, role, school, password } = body

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } })
      if (emailTaken) return NextResponse.json({ success: false, error: "อีเมลนี้ได้ถูกใช้งานแล้ว" }, { status: 400 })
    }

    const data: {
      name?: string
      email?: string
      role?: "STUDENT" | "INSTRUCTOR" | "ADMIN"
      school?: string | null
      password?: string
    } = {
      name,
      email,
      role,
      school: school ?? null,
    }
    if (password) {
      data.password = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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
      },
    })

    return NextResponse.json({ success: true, data: user, message: "แก้ไขข้อมูลผู้ใช้สำเร็จ" })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้" }, { status: 400 })
  }
}

// DELETE: /api/admin/users/[id] - delete a user, blocked if they have any
// purchase or enrollment history (to avoid orphaning it), mirroring the
// delete-guard pattern used by /api/admin/courses/[id].
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        include: { orders: true, enrollments: true },
      })
      if (!user) throw new Error("User not found")

      if (user.orders.length > 0) {
        throw new Error(`ไม่สามารถลบผู้ใช้นี้ได้ เนื่องจากมีคำสั่งซื้อ ${user.orders.length} รายการอยู่ในระบบ`)
      }
      if (user.enrollments.length > 0) {
        throw new Error(`ไม่สามารถลบผู้ใช้นี้ได้ เนื่องจากมีการลงทะเบียนเรียน ${user.enrollments.length} คอร์สอยู่ในระบบ`)
      }

      await tx.user.delete({ where: { id } })

      return { id: user.id, name: user.name }
    })

    return NextResponse.json({ success: true, message: "ลบผู้ใช้สำเร็จ", data: result })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบผู้ใช้" },
      { status: 400 }
    )
  }
}
