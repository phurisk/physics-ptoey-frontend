import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createExternalToken } from "@/lib/jwt"

// POST: /api/auth/login - email/password login, issues the external JWT
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
    if (!user) return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้นี้" }, { status: 404 })

    if (!user.password) {
      // First password set for an account created via LINE — auto-migrate instead of rejecting.
      const hashed = await bcrypt.hash(password, 12)
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    } else {
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) return NextResponse.json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
    }

    const token = createExternalToken(user)
    const { password: _unused, ...userWithoutPassword } = user

    const response = NextResponse.json({ success: true, message: "เข้าสู่ระบบสำเร็จ", data: { ...userWithoutPassword, token }, token })
    response.cookies.set("jwt", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 })
  }
}
