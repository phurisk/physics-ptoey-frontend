import { verifyExternalToken, type ExternalTokenPayload } from "@/lib/jwt"

/**
 * Guard for customer-facing routes. Reads the bearer token the frontend
 * attaches on every request (see lib/http.ts), falling back to the httpOnly
 * `jwt` cookie when there's no Authorization header. Callers must derive
 * `userId` from the returned payload — never from a client-supplied
 * query/body param — and respond 401 when this returns null.
 */
export function requireUser(request: Request): ExternalTokenPayload | null {
  const authHeader = request.headers.get("authorization") || ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null

  let cookieToken: string | null = null
  if (!bearer) {
    const cookieHeader = request.headers.get("cookie") || ""
    const match = cookieHeader.match(/(?:^|;\s*)jwt=([^;]+)/)
    cookieToken = match ? decodeURIComponent(match[1]) : null
  }

  const token = bearer || cookieToken
  if (!token) return null

  const verification = verifyExternalToken(token)
  return verification.valid ? verification.data : null
}
