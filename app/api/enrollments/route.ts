import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) return NextResponse.json({ error: "API_BASE_URL is not configured" }, { status: 500 })
  try {
    const url = new URL(req.url)
    const search = url.search || ""
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/enrollments${search}`, { headers: { cookie }, cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch enrollment" }, { status: 502 })
  }
}

export async function PATCH(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) return NextResponse.json({ error: "API_BASE_URL is not configured" }, { status: 500 })
  try {
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/enrollments`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) return NextResponse.json({ error: "API_BASE_URL is not configured" }, { status: 500 })
  try {
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/enrollments`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 502 })
  }
}

