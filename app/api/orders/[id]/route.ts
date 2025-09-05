import { NextResponse, NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Missing order id" },
      { status: 400 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(id)}`, {
      headers: { cookie },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 502 }
    )
  }
}

