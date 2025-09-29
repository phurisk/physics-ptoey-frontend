import { NextResponse } from "next/server"

function ensureBaseUrl() {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured")
  }
  return baseUrl.replace(/\/$/, "")
}

export async function GET(req: Request) {
  try {
    const baseUrl = ensureBaseUrl()
    const url = new URL(req.url)
    const search = url.search || ""
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/cart${search}`, {
      method: "GET",
      headers: { cookie },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    const message = error?.message || "Failed to fetch cart"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const baseUrl = ensureBaseUrl()
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    const message = error?.message || "Failed to update cart"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const baseUrl = ensureBaseUrl()
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/cart`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    const message = error?.message || "Failed to remove cart item"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
