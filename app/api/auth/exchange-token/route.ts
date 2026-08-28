import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createExternalToken } from "@/lib/jwt"

// POST: /api/auth/exchange-token - exchange a NextAuth session (admin login)
// for an external JWT, so the same account can also call the customer-facing
// JWT-guarded API routes.
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    const token = createExternalToken(user)
    const { password: _unused, ...userWithoutPassword } = user

    const response = NextResponse.json({ success: true, data: { token, user: userWithoutPassword } })
    response.cookies.set("jwt", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error("Exchange token error:", error)
    return NextResponse.json({ success: false, error: "Failed to exchange token" }, { status: 500 })
  }
}
