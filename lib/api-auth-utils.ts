import { NextResponse } from "next/server"

/**
 * Get authentication headers from request
 * Supports both cookie and Authorization header
 */
export function getAuthHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {}
  
  const cookie = req.headers.get("cookie")
  if (cookie) {
    headers["cookie"] = cookie
  }
  
  const authorization = req.headers.get("authorization")
  if (authorization) {
    headers["authorization"] = authorization
  }
  
  return headers
}

/**
 * Check if request has authentication
 * Returns true if either cookie or authorization header exists
 */
export function hasAuth(req: Request): boolean {
  const cookie = req.headers.get("cookie")
  const authorization = req.headers.get("authorization")
  return !!(cookie || authorization)
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = "กรุณาเข้าสู่ระบบ") {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

/**
 * Create error response for API proxy
 */
export function proxyErrorResponse(message = "Failed to connect to API", status = 502) {
  return NextResponse.json(
    { success: false, message },
    { status }
  )
}

/**
 * Get API base URL from environment
 */
export function getApiBaseUrl(): string | null {
  return process.env.API_BASE_URL || null
}

/**
 * Check if API base URL is configured
 */
export function checkApiConfig(): { ok: boolean; error?: NextResponse } {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    return {
      ok: false,
      error: NextResponse.json(
        { success: false, message: "API_BASE_URL is not configured" },
        { status: 500 }
      ),
    }
  }
  return { ok: true }
}
