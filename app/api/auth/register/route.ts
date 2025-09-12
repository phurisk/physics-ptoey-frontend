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
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    const response = NextResponse.json(data, { status: res.status })

    return response
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to register" },
      { status: 502 }
    )
  }
}
