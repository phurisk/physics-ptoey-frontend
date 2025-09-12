import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured", data: [] },
      { status: 500 }
    )
  }

  try {
    const url = new URL(req.url)
    const search = url.search || ""

    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""
    const headers: Record<string, string> = {}
    if (cookie) headers["cookie"] = cookie
    if (authorization) headers["authorization"] = authorization

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reviews${search}`, {
      headers,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch reviews", data: [] },
      { status: 502 }
    )
  }
}

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""
    const headers: Record<string, string> = { "content-type": "application/json" }
    if (cookie) headers["cookie"] = cookie
    if (authorization) headers["authorization"] = authorization

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reviews`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to post review" },
      { status: 502 }
    )
  }
}

