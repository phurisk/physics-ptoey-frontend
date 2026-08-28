import { NextResponse } from "next/server"
import { refreshExternalToken } from "@/lib/jwt"

// POST: /api/external/auth/refresh - issue a fresh JWT from a still-valid one
export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ success: false, message: "Missing token" }, { status: 400 })

    const nextToken = refreshExternalToken(token)
    if (!nextToken) return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })

    const response = NextResponse.json({ success: true, data: { token: nextToken, expiresIn: "7d" } })
    response.cookies.set("jwt", nextToken, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
