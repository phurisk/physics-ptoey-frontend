import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { valid: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Missing token" },
        { status: 400 }
      )
    }


    const res = await fetch(`${baseUrl}/api/external/auth/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    const data = await res.json()

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
