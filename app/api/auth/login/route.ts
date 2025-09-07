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
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      // do not cache auth
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    const response = NextResponse.json(data, { status: res.status })
    const setCookie = res.headers.get("set-cookie")
    if (setCookie) {
      // Pass through original Set-Cookie for compatibility
      response.headers.set("set-cookie", setCookie)
      // Also persist backend cookie string into our own cookie so subsequent API calls can forward it
      try {
        const encoded = encodeURIComponent(setCookie)
        // Store for 7 days by default
        const maxAge = 60 * 60 * 24 * 7
        response.cookies.set("backend_cookie", encoded, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge,
        })
      } catch {}
    }
    // If backend also returns a JWT, store it as httpOnly cookie for download flow
    try {
      const token = (data?.data && (data?.data.token || data?.token)) || data?.token
      if (typeof token === "string" && token.length > 0) {
        response.cookies.set("jwt", token, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          // 7 days
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    } catch {}
    return response
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to login" },
      { status: 502 }
    )
  }
}
