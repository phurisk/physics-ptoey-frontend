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
    const url = new URL(req.url)
    const search = url.search || ""
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""
    
    const headers: Record<string, string> = { cookie }
    if (authorization) {
      headers["authorization"] = authorization
    }
    
    const res = await fetch(`${baseUrl}/api/get-progress${search}`, {
      headers,
      cache: "no-store",
    })
    
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to get progress" },
      { status: 502 }
    )
  }
}

export async function DELETE(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const url = new URL(req.url)
    const search = url.search || ""
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""
    
    const headers: Record<string, string> = { cookie }
    if (authorization) {
      headers["authorization"] = authorization
    }
    
    const res = await fetch(`${baseUrl}/api/reset-progress${search}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    })
    
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to reset progress" },
      { status: 502 }
    )
  }
}
