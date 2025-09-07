import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { code, redirectUri } = body

    if (!code || !redirectUri) {
      return NextResponse.json(
        { success: false, message: "Missing code or redirectUri" },
        { status: 400 }
      )
    }

 
    const res = await fetch(`${baseUrl}/api/external/auth/line`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, redirectUri }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "LINE login failed" },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("LINE login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
