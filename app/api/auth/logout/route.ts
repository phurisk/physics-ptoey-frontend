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
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { cookie },
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    const response = NextResponse.json(data, { status: res.status })
   

    try { response.cookies.set("backend_cookie", "", { path: "/", maxAge: 0 }) } catch {}
    try { response.cookies.set("jwt", "", { path: "/", maxAge: 0 }) } catch {}
    return response
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to logout" },
      { status: 502 }
    )
  }
}
