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
    const cookie = req.headers.get("cookie") ?? ""
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
      headers: { cookie },
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

