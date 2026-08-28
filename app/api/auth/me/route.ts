import { NextResponse } from "next/server"
import { verifyExternalToken } from "@/lib/jwt"

// GET: /api/auth/me - reads the httpOnly jwt cookie only (no Bearer support
// here, unlike requireUser). Sourced straight from the token payload — can
// be stale relative to the DB if the profile was edited elsewhere.
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || ""
    const match = cookieHeader.match(/(?:^|;\s*)jwt=([^;]+)/)
    const token = match ? decodeURIComponent(match[1]) : null

    if (!token) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })

    const verification = verifyExternalToken(token)
    if (!verification.valid) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 })

    const { userId, email, name, role, lineId } = verification.data
    return NextResponse.json({ success: true, data: { id: userId, email, name, role, lineId } })
  } catch (error) {
    console.error("Get me error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch current user" }, { status: 500 })
  }
}
