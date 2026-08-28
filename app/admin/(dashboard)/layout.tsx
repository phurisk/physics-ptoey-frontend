"use client"

import type React from "react"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "../_lib/AdminAuthContext"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminHeader from "@/components/admin/AdminHeader"
import AdminLoadingScreen from "@/components/admin/AdminLoadingScreen"
import AdminAccessDenied from "@/components/admin/AdminAccessDenied"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, isAuthenticated, logout } = useAdminAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (loading) {
    return <AdminLoadingScreen />
  }

  if (!isAuthenticated) {
    router.replace(`/admin/login?redirect=${encodeURIComponent(pathname || "/admin/dashboard")}`)
    return <AdminLoadingScreen />
  }

  if (user?.role !== "ADMIN") {
    return <AdminAccessDenied />
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside style={{ width: collapsed ? 80 : 220 }} className="shrink-0 transition-[width] duration-200">
        <AdminSidebar collapsed={collapsed} pathname={pathname || ""} onToggle={() => setCollapsed((v) => !v)} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onToggle={() => setCollapsed((v) => !v)} user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  )
}
