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
    const authorization = req.headers.get("authorization") ?? ""
    
    const headers: Record<string, string> = { 
      "content-type": "application/json",
      cookie 
    }
    if (authorization) {
      headers["authorization"] = authorization
    }
    
    const res = await fetch(`${baseUrl}/api/update-progress`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    })
    
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to update progress" },
      { status: 502 }
    )
  }
}
