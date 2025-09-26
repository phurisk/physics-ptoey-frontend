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
    const requestUrl = new URL(req.url)
    const search = requestUrl.search
    const cookie = req.headers.get("cookie") ?? ""
    const upstream = `${baseUrl.replace(/\/$/, "")}/api/courses${search}`
    const res = await fetch(upstream, {
      cache: "no-store",
      headers: { cookie },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch courses", data: [] },
      { status: 502 }
    )
  }
}
