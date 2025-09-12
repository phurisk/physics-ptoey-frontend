import { NextResponse, NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Missing ebook id" },
      { status: 400 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""
    const headers: Record<string, string> = {}
    if (cookie) headers["cookie"] = cookie
    if (authorization) headers["authorization"] = authorization

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/ebooks/${encodeURIComponent(id)}`, {
      headers,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch ebook" },
      { status: 502 }
    )
  }
}

