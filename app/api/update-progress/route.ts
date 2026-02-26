import { NextResponse } from "next/server"
import { getAuthHeaders, checkApiConfig } from "@/lib/api-auth-utils"

export async function POST(req: Request) {
  const config = checkApiConfig()
  if (!config.ok) return config.error
  const baseUrl = process.env.API_BASE_URL!

  try {
    const body = await req.json()
    const authHeaders = getAuthHeaders(req)
    
    const res = await fetch(`${baseUrl}/api/update-progress`, {
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
      { success: false, message: "Failed to update progress" },
      { status: 502 }
    )
  }
}
