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
    
    const res = await fetch(`${baseUrl}/api/progress${search}`, {
      headers: authHeaders,
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
  const config = checkApiConfig()
  if (!config.ok) return config.error
  const baseUrl = process.env.API_BASE_URL!

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId") || ""
    const courseId = url.searchParams.get("courseId") || ""
    const authHeaders = getAuthHeaders(req)
    
    const res = await fetch(`${baseUrl}/api/progress`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({ userId, courseId, progress: 0 }),
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
