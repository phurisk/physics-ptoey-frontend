import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured", data: [] },
      { status: 500 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/ebook-categories`, {
      next: { revalidate: 60 },
      headers: { cookie },
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch ebook categories", data: [] },
      { status: 502 }
    )
  }
}

