import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/user/checkout-info - which one-time checkout fields (school,
// phone, address) the current user still needs to supply. Checkout (POST
// /api/orders) requires all three the first time and has no other page to
// collect them, so the checkout forms call this first to decide which
// fields to show at all.
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { school: true, phone: true, address: true } })
    if (!dbUser) return NextResponse.json({ success: false, error: "ไม่พบผู้ใช้" }, { status: 404 })

    return NextResponse.json({ success: true, data: dbUser })
  } catch (error) {
    console.error("Get user checkout-info error:", error)
    return NextResponse.json({ success: false, error: "Failed to load user" }, { status: 500 })
  }
}
