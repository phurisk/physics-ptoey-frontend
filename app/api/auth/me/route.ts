import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const rawCookie = req.headers.get("cookie") ?? ""
   
    const backendCookie = (() => {
      try {
        const match = rawCookie.split(/;\s*/).find((p) => p.startsWith("backend_cookie="))
        if (!match) return null
        const val = decodeURIComponent(match.split("=").slice(1).join("="))
        return val
      } catch { return null }
    })()
   
    const toCookieHeader = (setCookie: string) => {
      try {
        const items = setCookie.split(/,\s*(?=[^=;,\s]+=)/g)
        const pairs = items.map((c) => c.split(";")[0].trim()).filter(Boolean)
        return pairs.join("; ")
      } catch {
        return ""
      }
    }
    const cookie = backendCookie ? toCookieHeader(backendCookie) : rawCookie
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch current user" },
      { status: 502 }
    )
  }
}
