import { NextResponse } from "next/server"
import { getAuthHeaders, checkApiConfig } from "@/lib/api-auth-utils"

export async function GET(req: Request) {
  const config = checkApiConfig()
  if (!config.ok) return config.error
  const baseUrl = process.env.API_BASE_URL!

  try {
    const url = new URL(req.url)
    const search = url.search || ""
    const authHeaders = getAuthHeaders(req)

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reviews${search}`, {
      headers: authHeaders,
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
  const config = checkApiConfig()
  if (!config.ok) return config.error
  const baseUrl = process.env.API_BASE_URL!

  try {
    const body = await req.json().catch(() => ({}))
    const authHeaders = getAuthHeaders(req)

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders
      },
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

