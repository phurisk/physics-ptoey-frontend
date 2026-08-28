import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/change-password - self-service password change for the logged-in admin
export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body || {}
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ success: false, error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) return NextResponse.json({ success: false, error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" }, { status: 500 })
  }
}
