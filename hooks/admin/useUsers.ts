"use client"
import { useState, useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminUser = {
  id: string
  name: string | null
  email: string | null
  image?: string | null
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN"
  lineId?: string | null
  school?: string | null
  createdAt: string
  updatedAt: string
  _count?: { orders: number; courses: number }
}

export type UserStats = { total: number; students: number; instructors: number; admins: number }

export function useUsers() {
  const [stats, setStats] = useState<UserStats>({ total: 0, students: 0, instructors: 0, admins: 0 })

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        search: (params.search as string) || "",
        role: (params.role as string) || "all",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })

      const res = await fetch(`/api/admin/users?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ")

      setStats(data.data.stats as UserStats)

      return { items: data.data.users as AdminUser[], total: data.data.pagination.total, page: data.data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminUser>({
    fetcher,
    initialFilters: { role: "all" },
  })

  return {
    users: list.items,
    loading: list.loading,
    stats,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchUsers: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    handleSortSelectChange: list.handleSortSelectChange,
    resetFilters: list.resetFilters,
  }
}
