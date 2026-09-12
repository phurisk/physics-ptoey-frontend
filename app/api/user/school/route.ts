import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/user/school - whether the current user already has a school on
// file. Checkout (POST /api/orders) requires one the first time and has no
// other page to collect it, so the checkout forms call this first to decide
// whether to show the field at all.
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { school: true } })
    if (!dbUser) return NextResponse.json({ success: false, error: "ไม่พบผู้ใช้" }, { status: 404 })

    return NextResponse.json({ success: true, data: { school: dbUser.school } })
  } catch (error) {
    console.error("Get user school error:", error)
    return NextResponse.json({ success: false, error: "Failed to load user" }, { status: 500 })
  }
}
