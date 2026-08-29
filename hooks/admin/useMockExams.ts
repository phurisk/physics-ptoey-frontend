import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminMockExam = {
  id: string
  title: string
  description?: string | null
  courseId?: string | null
  subject: string
  gradeLevel?: string | null
  timeLimit?: number | null
  price: number
  discountPrice?: number | null
  passingMarks: number
  attemptsAllowed: number
  allowPracticeMode: boolean
  allowRealMode: boolean
  practiceUnlockCost: number
  isActive: boolean
  examPdfUrl?: string | null
  course?: { id: string; title: string } | null
  _count?: { questions: number; attempts: number }
}

export function useMockExams() {
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.limit),
      search: (params.search as string) || "",
      subject: params.subject && params.subject !== "all" ? String(params.subject) : "",
      status: (params.status as string) || "all",
      sortBy: (params.sortBy as string) || "createdAt",
      sortOrder: (params.sortOrder as string) || "desc",
    })
    const res = await fetch(`/api/admin/mock-exams?${search}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "โหลดข้อมูลข้อสอบจำลองไม่สำเร็จ")
    return { items: data.data as AdminMockExam[], total: data.pagination.totalCount, page: data.pagination.page }
  }, [])

  const list = useAdminListState<AdminMockExam>({ fetcher, initialFilters: { subject: "all", status: "all" } })

  return {
    exams: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchExams: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
