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

    const res = await fetch(`${baseUrl}/api/my-courses/exam-results${search}`, {
      headers: authHeaders,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch exam results", attempts: [], pagination: {} },
      { status: 502 }
    )
  }
}

