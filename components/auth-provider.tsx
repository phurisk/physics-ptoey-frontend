"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

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
        try { localStorage.removeItem("user") } catch {}
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

      const userData = data?.data ?? null
      if (userData) {
        setUser(userData)
        try {
          localStorage.setItem("user", JSON.stringify(userData))
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

      const newUser = data?.data ?? null
      if (newUser) {
        setUser(newUser)
        try {
          localStorage.setItem("user", JSON.stringify(newUser))
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
    } catch {}
  }

  const loginWithLine = () => {
    
    window.location.href = "/api/auth/line"
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
