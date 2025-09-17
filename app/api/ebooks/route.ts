import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL?.trim()
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured", data: [] },
      { status: 500 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const url = new URL(req.url)
    const query = url.searchParams.toString()
    const upstreamUrl = `${baseUrl}/api/ebooks${query ? `?${query}` : ""}`

    const res = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { cookie },
    })
    const text = await res.text()
    let parsed: any = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch (err) {
      console.error("Failed to parse upstream ebooks response", err)
    }

    if (!res.ok) {
      console.error("Upstream /api/ebooks error", {
        url: upstreamUrl,
        status: res.status,
        body: text,
      })
      if (parsed) {
        return NextResponse.json(parsed, { status: res.status })
      }
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch ebooks from upstream",
          status: res.status,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(parsed ?? {}, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch ebooks", data: [] },
      { status: 502 }
    )
  }
}
