"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSession, signIn, signOut, getSession } from "next-auth/react"

type AdminUser = { id: string; name?: string | null; email?: string | null; role: string; image?: string | null }

type AdminAuthValue = {
  user: AdminUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; user?: AdminUser; error?: string }>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined)

// Thin wrapper around NextAuth's own session — not a separate auth system.
// `login`/`logout` just call `signIn`/`signOut` on the same credentials
// provider every app/api/admin/** route already trusts via requireAdmin().
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      setLoading(true)
      return
    }
    setUser((session?.user as AdminUser) ?? null)
    setLoading(false)
  }, [session, status])

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
      }
      const freshSession = await getSession()
      const userData = (freshSession?.user as AdminUser) ?? null
      setUser(userData)
      setLoading(false)
      return { success: true, user: userData ?? undefined }
    } catch (error) {
      console.error("Admin login error:", error)
      return { success: false, error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }
    }
  }

  const logout = async () => {
    setUser(null)
    await signOut({ callbackUrl: "/admin/login" })
  }

  const value: AdminAuthValue = { user, loading, isAuthenticated: !!user, login, logout }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  return context
}
