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

    console.log('🔵 [Frontend] LINE login proxy - Received code:', code?.substring(0, 20) + '...')
    console.log('🔵 [Frontend] Redirect URI:', redirectUri)

    if (!code || !redirectUri) {
      console.error('❌ [Frontend] Missing code or redirectUri')
      return NextResponse.json(
        { success: false, message: "Missing code or redirectUri" },
        { status: 400 }
      )
    }

    console.log('🔵 [Frontend] Calling backend LINE auth endpoint...')
    const res = await fetch(`${baseUrl}/api/external/auth/line`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, redirectUri }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      console.error('❌ [Frontend] Backend LINE auth failed:', data.message)
      return NextResponse.json(
        { success: false, message: data.message || "LINE login failed" },
        { status: res.status }
      )
    }

    console.log('✅ [Frontend] LINE login success, got token for user:', data.data?.user?.email)
    return NextResponse.json(data)
  } catch (error) {
    console.error("LINE login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
