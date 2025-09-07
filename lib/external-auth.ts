"use client"

// Lightweight external auth helper for LINE OAuth via the e-learning backend
// Stores token and user in localStorage to be used across pages.

type ExternalUser = any

const TOKEN_KEY = "elearning_token"
const USER_KEY = "elearning_user"

function isBrowser() {
  return typeof window !== "undefined"
}

export class ELearningAuth {
  baseUrl: string
  token: string | null
  user: ExternalUser | null

  constructor(baseUrl?: string) {
    // Require a public base URL for the external e-learning API
    const envBase = process.env.NEXT_PUBLIC_ELEARNING_BASE_URL || ""
    this.baseUrl = baseUrl || envBase
    this.token = isBrowser() ? localStorage.getItem(TOKEN_KEY) : null
    this.user = isBrowser() ? JSON.parse(localStorage.getItem(USER_KEY) || "null") : null
  }

  // 1. Start LINE Login
  async initiateLineLogin() {
    if (!isBrowser()) return
    const clientId = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
    if (!clientId) {
      console.error("NEXT_PUBLIC_LINE_CLIENT_ID is not configured")
      return
    }
    const redirectUri = `${window.location.origin}/auth/callback`
    const state = JSON.stringify({ returnUrl: window.location.href })

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "profile openid",
      state,
    })
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
    window.location.href = lineAuthUrl
  }

  // 2. Handle LINE Callback
  async handleLineCallback(code: string, state?: string | null) {
    if (!this.baseUrl) throw new Error("Missing external auth base URL")
    try {
      const redirectUri = isBrowser() ? `${window.location.origin}/auth/callback` : ""
      const response = await fetch(`${this.baseUrl}/api/external/auth/line`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      })
      const result = await response.json()
      if (result?.success) {
        const token: string = result.data.token
        this.token = token
        this.user = result.data.user
        if (isBrowser()) {
          localStorage.setItem(TOKEN_KEY, token)
          localStorage.setItem(USER_KEY, JSON.stringify(this.user))
        }
        let returnUrl = "/"
        try {
          if (state) {
            let s: string = state
            // URLSearchParams already decodes once; handle potential double-encoding defensively
            try { JSON.parse(s); } catch (e1) { try { s = decodeURIComponent(s) } catch (e2) {} }
            try { JSON.parse(s); } catch (e3) { try { s = decodeURIComponent(s) } catch (e4) {} }
            const stateData = JSON.parse(s)
            if (stateData?.returnUrl) returnUrl = stateData.returnUrl
          }
        } catch (e) {}
        return { ...result.data, returnUrl }
      }
      throw new Error(result?.error || "LINE login failed")
    } catch (err) {
      console.error("LINE login failed:", err)
      throw err
    }
  }

  // 3. Validate Token
  async validateToken() {
    if (!this.token) return { valid: false }
    if (!this.baseUrl) return { valid: false }
    try {
      const res = await fetch(`${this.baseUrl}/api/external/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: this.token }),
      })
      const result = await res.json()
      if (result?.valid) {
        this.user = result.user
        if (isBrowser()) localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      } else {
        this.logout()
      }
      return result
    } catch (err) {
      console.error("Token validation failed:", err)
      this.logout()
      return { valid: false }
    }
  }

  // 4. Refresh Token
  async refreshToken() {
    if (!this.token || !this.baseUrl) return false
    try {
      const res = await fetch(`${this.baseUrl}/api/external/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: this.token }),
      })
      const result = await res.json()
      if (result?.success) {
        const token: string = result.data.token
        this.token = token
        this.user = result.data.user
        if (isBrowser()) {
          localStorage.setItem(TOKEN_KEY, token)
          localStorage.setItem(USER_KEY, JSON.stringify(this.user))
        }
        return true
      }
      return false
    } catch (err) {
      console.error("Token refresh failed:", err)
      return false
    }
  }

  // 5. Get User Info
  getUser() {
    return this.user
  }

  // 6. Check if Authenticated
  isAuthenticated() {
    return !!this.token && !!this.user
  }

  // 7. Logout
  logout() {
    this.token = null
    this.user = null
    if (isBrowser()) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  // 8. API Call with Authentication
  async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.token) throw new Error("Not authenticated")
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...(options.headers || {}),
      },
    })
    if (res.status === 401) {
      const refreshed = await this.refreshToken()
      if (refreshed) return this.apiCall(endpoint, options)
      this.logout()
      throw new Error("Authentication expired")
    }
    return res.json()
  }
}

export const externalAuth = new ELearningAuth()
