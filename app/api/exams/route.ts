import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.API_BASE_URL
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: "API_BASE_URL is not configured" },
        { status: 500 }
      )
    }

    const url = new URL(req.url)
    const upstream = new URL("/api/exams", baseUrl)

    const allowed = new Set([
      "page",
      "limit",
      "q",
      "type",
      "examType",
      "categoryType",
      "year",
      "categoryId",
      "search",
    ])
    url.searchParams.forEach((v, k) => {
      if (allowed.has(k) && v !== "") upstream.searchParams.set(k, v)
    })

    const cookie = req.headers.get("cookie") || undefined
    const r = await fetch(upstream.toString(), {
      cache: "no-store",
      headers: cookie ? { cookie } : undefined,
    })
    const data = await r.json().catch(() => ({}))
    return NextResponse.json(data, { status: r.status })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ?? "proxy error" },
      { status: 500 }
    )
  }
}
