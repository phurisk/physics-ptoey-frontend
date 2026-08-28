import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createExternalToken } from "@/lib/jwt"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST: /api/auth/register - create account, issues the external JWT
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, confirmPassword } = body

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "รหัสผ่านไม่ตรงกัน" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
    if (existing) return NextResponse.json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 })

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name, email: String(email).toLowerCase(), password: hashed, role: "STUDENT" } })

    const token = createExternalToken(user)
    const { password: _unused, ...userWithoutPassword } = user

    const response = NextResponse.json({ success: true, message: "สมัครสมาชิกสำเร็จ", data: { ...userWithoutPassword, token }, token })
    response.cookies.set("jwt", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 })
  }
}
