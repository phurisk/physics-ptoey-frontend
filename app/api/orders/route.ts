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
    const res = await fetch(`${baseUrl}/api/orders${search}`, {
      headers: { cookie },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders", data: [] },
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
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 502 }
    )
  }
}

