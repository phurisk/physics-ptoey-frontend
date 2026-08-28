import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

// Protects /admin/** PAGE routes only — /api/admin/** routes guard themselves
// via requireAdmin() so they can return proper 401 JSON instead of a redirect.
// Uses raw getToken (not withAuth) with an explicit secureCookie flag so the
// session cookie is found reliably behind Vercel's HTTPS proxy in production.
export default async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })

  if (!token) {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token.role !== "ADMIN") {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("error", "AccessDenied")
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
}
