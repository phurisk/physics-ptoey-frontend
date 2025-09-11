import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  const url = new URL(req.url)
  const origin = `${url.protocol}//${url.host}`

  const returnUrl = url.searchParams.get("returnUrl") || ""
  let callbackRaw = `${origin}/api/auth/callback/line`
  if (returnUrl) {
    callbackRaw += `?returnUrl=${encodeURIComponent(returnUrl)}`
  }
  const callbackUrl = encodeURIComponent(callbackRaw)

  return NextResponse.redirect(`${baseUrl}/api/auth/signin/line?callbackUrl=${callbackUrl}`)
}
