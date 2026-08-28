"use client"
import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminReview = {
  id: string
  userId: string
  courseId?: string | null
  ebookId?: string | null
  rating: number
  title?: string | null
  comment?: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string | null; email: string | null; image: string | null } | null
  course?: { id: string; title: string } | null
  ebook?: { id: string; title: string } | null
}

export function useReviews() {
  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        search: (params.search as string) || "",
        rating: (params.rating as string) || "all",
        targetType: (params.targetType as string) || "all",
        isVerified: (params.isVerified as string) || "all",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })

      const res = await fetch(`/api/admin/reviews?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลรีวิวไม่สำเร็จ")

      return { items: data.data as AdminReview[], total: data.pagination.total, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminReview>({
    fetcher,
    initialFilters: {
      rating: "all",
      targetType: "all",
      isVerified: "all",
    },
  })

  return {
    reviews: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchReviews: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    handleSortSelectChange: list.handleSortSelectChange,
    resetFilters: list.resetFilters,
  }
}
