import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createExternalToken } from "@/lib/jwt"

type LineProfile = { userId: string; displayName: string; pictureUrl?: string; email?: string }

// POST: /api/external/auth/line - exchange a LINE authorization code for our
// own external JWT. Called by components/auth-provider.tsx right after the
// browser lands back from app/api/auth/callback/line.
export async function POST(req: Request) {
  try {
    const { code, redirectUri } = await req.json()
    if (!code || !redirectUri) {
      return NextResponse.json({ success: false, message: "Missing code or redirectUri" }, { status: 400 })
    }

    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINE_CLIENT_ID || "",
        client_secret: process.env.LINE_CLIENT_SECRET || "",
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("LINE token exchange failed:", errorText)
      return NextResponse.json({ success: false, message: "Failed to exchange authorization code" }, { status: 400 })
    }

    const tokens = await tokenResponse.json()

    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!profileResponse.ok) {
      return NextResponse.json({ success: false, message: "Failed to fetch user profile" }, { status: 400 })
    }
    const lineProfile: LineProfile = await profileResponse.json()

    let user = await prisma.user.findUnique({ where: { lineId: lineProfile.userId } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          lineId: lineProfile.userId,
          email: lineProfile.email || `${lineProfile.userId}@line.user`,
          name: lineProfile.displayName,
          image: lineProfile.pictureUrl,
          role: "STUDENT",
        },
      })
    } else {
      user = await prisma.user.update({ where: { id: user.id }, data: { name: lineProfile.displayName, image: lineProfile.pictureUrl } })
    }

    const token = createExternalToken(user)
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, lineId: user.lineId },
        expiresIn: "7d",
        tokenType: "Bearer",
      },
    })
    response.cookies.set("jwt", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error("LINE login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
