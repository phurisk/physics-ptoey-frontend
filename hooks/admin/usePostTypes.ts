"use client"
import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminPostType = {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { posts: number }
}

export function usePostTypes() {
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.limit),
      search: (params.search as string) || "",
      status: (params.status as string) || "ALL",
      sortBy: (params.sortBy as string) || "name",
      sortOrder: (params.sortOrder as string) || "asc",
    })

    const res = await fetch(`/api/admin/post-types?${search}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "โหลดข้อมูลประเภทบทความไม่สำเร็จ")

    return { items: data.data as AdminPostType[], total: data.pagination.totalCount, page: data.pagination.page }
  }, [])

  const list = useAdminListState<AdminPostType>({ fetcher, initialFilters: { status: "ALL" } })

  return {
    postTypes: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchPostTypes: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
