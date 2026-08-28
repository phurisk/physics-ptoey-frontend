import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminEnrollment = {
  id: string
  userId: string
  courseId: string
  progress: number
  status: string
  enrolledAt: string
  accessDuration?: number | null
  accessHours?: number | null
  user: { id: string; name: string | null; email: string | null }
  course: { id: string; title: string; accessDuration?: number | null }
}

export function useEnrollments() {
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.limit),
      search: (params.search as string) || "",
      status: (params.status as string) || "ALL",
      sortBy: (params.sortBy as string) || "enrolledAt",
      sortOrder: (params.sortOrder as string) || "desc",
    })

    const res = await fetch(`/api/admin/enrollments?${search}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "โหลดข้อมูลการลงทะเบียนไม่สำเร็จ")

    return { items: data.data as AdminEnrollment[], total: data.pagination.totalCount, page: data.pagination.page }
  }, [])

  const list = useAdminListState<AdminEnrollment>({
    fetcher,
    defaultSortBy: "enrolledAt",
    initialFilters: { status: "ALL" },
  })

  return {
    enrollments: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchEnrollments: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
