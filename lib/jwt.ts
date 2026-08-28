import jwt from "jsonwebtoken"
import type { User } from "@prisma/client"

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set — refusing to sign/verify JWTs with a fallback secret")
}
const JWT_SECRET = process.env.NEXTAUTH_SECRET
const JWT_EXPIRES_IN = "7d"
const ISSUER = "physics-ptoey"
const AUDIENCE = "external-frontend"

export type ExternalTokenPayload = {
  userId: string
  email: string | null
  name: string | null
  role: string
  lineId: string | null
  iat?: number
  exp?: number
  iss?: string
  aud?: string
}

/** Create a JWT for the customer-facing (non-NextAuth) auth flow. */
export function createExternalToken(user: Pick<User, "id" | "email" | "name" | "role" | "lineId">): string {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    lineId: user.lineId,
    iat: Math.floor(Date.now() / 1000),
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, issuer: ISSUER, audience: AUDIENCE })
}

export function verifyExternalToken(token: string): { valid: true; data: ExternalTokenPayload } | { valid: false; error: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: ISSUER, audience: AUDIENCE }) as ExternalTokenPayload
    return { valid: true, data: decoded }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Invalid token" }
  }
}

export function refreshExternalToken(token: string): string | null {
  const verification = verifyExternalToken(token)
  if (!verification.valid) return null

  const { iat, exp, iss, aud, ...userData } = verification.data
  return jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, issuer: ISSUER, audience: AUDIENCE })
}
