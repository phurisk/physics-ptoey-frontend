import { NextResponse } from "next/server"
import { getAuthHeaders, checkApiConfig } from "@/lib/api-auth-utils"

export async function POST(req: Request) {
  const config = checkApiConfig()
  if (!config.ok) return config.error
  const baseUrl = process.env.API_BASE_URL!

  try {
    const authHeaders = getAuthHeaders(req)
    const incoming = await req.formData()
    const form = new FormData()
    for (const [key, value] of incoming.entries()) {
      form.append(key, value as any)
    }

    if (!incoming.has("file") && incoming.has("slip")) {
      const slip = incoming.get("slip") as any
      if (slip) form.append("file", slip)
    }

    const res = await fetch(`${baseUrl}/api/payments/upload-slip`, {
      method: "POST",
      headers: authHeaders,
      body: form,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to upload payment slip" },
      { status: 502 }
    )
  }
}

