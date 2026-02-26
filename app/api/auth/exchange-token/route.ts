import { NextResponse } from "next/server"
import { getAuthHeaders, checkApiConfig, proxyErrorResponse } from "@/lib/api-auth-utils"

/**
 * Exchange NextAuth session for JWT token
 * Allows users logged in via backend admin (NextAuth) to get JWT tokens for frontend use
 */
export async function POST(req: Request) {
  const config = checkApiConfig()
  if (!config.ok) return config.error
  const baseUrl = process.env.API_BASE_URL!

  try {
    const authHeaders = getAuthHeaders(req)
    console.log('🔵 [Frontend] Token exchange - Auth headers:', Object.keys(authHeaders))
    
    const res = await fetch(`${baseUrl}/api/auth/exchange-token`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    
    const data = await res.json().catch(() => ({}))
    if (data.success) {
      console.log('✅ [Frontend] Token exchange success for user:', data.data?.user?.email)
    } else {
      console.error('❌ [Frontend] Token exchange failed:', data.error)
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return proxyErrorResponse("Failed to exchange token")
  }
}
