import { NextResponse } from "next/server"

// POST: /api/auth/logout - clear the auth cookies
export async function POST() {
  const response = NextResponse.json({ success: true, message: "ออกจากระบบสำเร็จ" })
  response.cookies.set("jwt", "", { path: "/", maxAge: 0 })
  response.cookies.set("backend_cookie", "", { path: "/", maxAge: 0 })
  return response
}
