import { NextResponse, NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured", data: null },
      { status: 500 }
    )
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Missing exam id", data: null },
      { status: 400 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    
    const url = new URL(req.url)
    const search = url.search || ""
    const res = await fetch(`${baseUrl}/api/exams/${encodeURIComponent(id)}${search}`, {
      next: { revalidate: 60 },
      headers: { cookie },
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch exam", data: null },
      { status: 502 }
    )
  }
}

