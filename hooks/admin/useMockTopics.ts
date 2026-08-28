import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminMockTopic = {
  id: string
  subject: string
  name: string
  createdAt: string
  _count?: { questions: number }
}

export function useMockTopics() {
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.limit),
      search: (params.search as string) || "",
      subject: params.subject && params.subject !== "all" ? String(params.subject) : "",
      sortBy: (params.sortBy as string) || "createdAt",
      sortOrder: (params.sortOrder as string) || "desc",
    })
    const res = await fetch(`/api/admin/mock-topics?${search}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "โหลดข้อมูลหัวข้อไม่สำเร็จ")
    return { items: data.data as AdminMockTopic[], total: data.pagination.totalCount, page: data.pagination.page }
  }, [])

  const list = useAdminListState<AdminMockTopic>({ fetcher, initialFilters: { subject: "all" } })

  return {
    topics: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchTopics: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}

// Used by MockExamQuestionModal / FlashcardDeckModal to populate a
// subject-scoped topic dropdown without pulling in the full list-state hook.
export async function fetchMockTopicsForSubject(subject: string): Promise<AdminMockTopic[]> {
  if (!subject) return []
  const res = await fetch(`/api/admin/mock-topics?subject=${encodeURIComponent(subject)}&pageSize=100`)
  const data = await res.json()
  if (!data.success) return []
  return data.data as AdminMockTopic[]
}
