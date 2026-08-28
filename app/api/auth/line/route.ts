import { NextResponse } from "next/server"

// GET: /api/auth/line - redirect into our own NextAuth LINE sign-in flow
// (the admin-facing path; the customer LINE login instead goes through
// components/auth-provider.tsx's loginWithLine(), which builds the LINE
// authorize URL directly).
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = `${url.protocol}//${url.host}`

  const returnUrl = url.searchParams.get("returnUrl") || ""
  let callbackRaw = `${origin}/api/auth/callback/line`
  if (returnUrl) callbackRaw += `?returnUrl=${encodeURIComponent(returnUrl)}`
  const callbackUrl = encodeURIComponent(callbackRaw)

  return NextResponse.redirect(`${origin}/api/auth/signin/line?callbackUrl=${callbackUrl}`)
}
