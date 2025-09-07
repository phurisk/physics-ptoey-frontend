"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { exchangeToken } from "@/lib/api-utils"

type User = any

type AuthContextValue = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  register: (userData: any) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: () => Promise<void>
  loginWithLine: () => void
  updateUser: (u: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const init = async () => {
      try {
        // check login success callback 
        const urlParams = new URLSearchParams(window.location.search)
        const loginSuccess = urlParams.get('login_success')
        const userId = urlParams.get('user_id')
        const userName = urlParams.get('user_name')
        const userEmail = urlParams.get('user_email')
        const lineId = urlParams.get('line_id')
        
        if (loginSuccess === 'true' && userId && userName) {
          // create user object from URL parameters
          const userData = {
            id: userId,
            name: decodeURIComponent(userName),
            email: decodeURIComponent(userEmail || ''),
            lineId: lineId,
            role: 'STUDENT' 
          }

          // transform temporary data into JWT token 
          try {
            const tokenResult = await exchangeToken(userId, lineId || undefined)
            if (tokenResult.success && tokenResult.data) {
              setUser(tokenResult.data.user)
              localStorage.setItem('user', JSON.stringify(tokenResult.data.user))
              localStorage.setItem('token', tokenResult.data.token)
              localStorage.removeItem('temp_token') // clear temp token

              console.log('✅ LINE login success with JWT token:', tokenResult.data.user)
            } else {
              // when exchange failed, use temp data
              setUser(userData)
              localStorage.setItem('user', JSON.stringify(userData))
              localStorage.setItem('temp_token', `temp_${userId}_${Date.now()}`)
              console.log('⚠️ Using temporary token, exchange failed:', tokenResult.message)
            }
          } catch (error) {
            // when exchange error, use temp data
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
            localStorage.setItem('temp_token', `temp_${userId}_${Date.now()}`)
            console.log('⚠️ Using temporary token, exchange error:', error)
          }

          // remove parameters from URL
          window.history.replaceState({}, document.title, window.location.pathname)
          if (active) setLoading(false)
          return
        }

        // check LINE callback code 
        const code = urlParams.get('code')
        
        if (code) {
          //  LINE callback code -  login
          try {
            const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/'
            const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/external/auth/line`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                code: code, 
                redirectUri: window.location.origin 
              })
            })
            
            const result = await response.json()
            if (result.success && result.data) {
              const userData = result.data.user
              setUser(userData)
              localStorage.setItem('user', JSON.stringify(userData))
              localStorage.setItem('token', result.data.token)

              // remove code from URL
              window.history.replaceState({}, document.title, window.location.pathname)
              if (active) setLoading(false)
              return
            }
          } catch (error) {
            console.error('LINE login error:', error)
            // remove code from URL error
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }

        // check token 
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
          try {
            const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/'
            const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/external/auth/validate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: savedToken })
            })
            
            const result = await response.json()
            if (result.valid && result.user) {
              if (active) setUser(result.user)
              localStorage.setItem('user', JSON.stringify(result.user))
              if (active) setLoading(false)
              return
            } else {
              // Token expired - remove
              localStorage.removeItem('token')
              localStorage.removeItem('user')
            }
          } catch (error) {
            console.error('Token validation error:', error)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }

        // check user  (fallback)
        const savedUser = localStorage.getItem("user")
        if (savedUser) {
          if (active) setUser(JSON.parse(savedUser))
          return
        }

        // Try to recover session from server cookie (e.g., LINE login)
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        const data = await res.json().catch(() => ({} as any))
        if (active && res.ok && data && data.success !== false && data.data) {
          setUser(data.data)
          try { localStorage.setItem("user", JSON.stringify(data.data)) } catch {}
        }
      } catch (e) {
        console.error("Failed to initialize auth", e)
        try { 
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        } catch {}
      } finally {
        if (active) setLoading(false)
      }
    }
    init()
    return () => { active = false }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.success === false) {
        return { success: false, error: (data as any)?.error || (data as any)?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
      }

      const userData = (data?.data && (data?.data.user || data?.data)) || null
      const token = (data?.data && data?.data.token) || data?.token || null
      if (userData) {
        setUser(userData)
        try {
          localStorage.setItem("user", JSON.stringify(userData))
          if (token) localStorage.setItem("token", token)
        } catch {}
      }
      return { success: true, user: userData }
    } catch (err) {
      console.error("Login error", err)
      return { success: false, error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }
    }
  }

  const register = async (userData: any) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.success === false) {
        return { success: false, error: (data as any)?.error || (data as any)?.message || "ลงทะเบียนไม่สำเร็จ" }
      }

      const newUser = (data?.data && (data?.data.user || data?.data)) || null
      const token = (data?.data && data?.data.token) || data?.token || null
      if (newUser) {
        setUser(newUser)
        try {
          localStorage.setItem("user", JSON.stringify(newUser))
          if (token) localStorage.setItem("token", token)
        } catch {}
      }
      return { success: true, user: newUser }
    } catch (err) {
      console.error("Register error", err)
      return { success: false, error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }
    }
  }

  const logout = async () => {
    
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    } catch {}
    setUser(null)
    try {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
    } catch {}
  }

  const loginWithLine = () => {
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/'
    const redirectUri = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/callback/line`
    
    const lineURL = 'https://access.line.me/oauth2/v2.1/authorize?' +
      'response_type=code' +
      `&client_id=${process.env.NEXT_PUBLIC_LINE_CHANNEL_ID}` +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=profile%20openid' +
      '&state=' + encodeURIComponent(window.location.origin) // sent origin to state for redirect back

    window.location.href = lineURL
  }

  const updateUser = (u: User) => {
    setUser(u)
    try {
      localStorage.setItem("user", JSON.stringify(u))
    } catch {}
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginWithLine,
    updateUser,
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
