import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminFlashcardDeck = {
  id: string
  title: string
  description?: string | null
  subject: string
  gradeLevel?: string | null
  topicId?: string | null
  coverImageUrl?: string | null
  isActive: boolean
  topic?: { id: string; name: string } | null
  _count?: { cards: number }
}

export function useFlashcardDecks() {
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.limit),
      search: (params.search as string) || "",
      subject: params.subject && params.subject !== "all" ? String(params.subject) : "",
      gradeLevel: params.gradeLevel && params.gradeLevel !== "all" ? String(params.gradeLevel) : "",
      status: (params.status as string) || "all",
      sortBy: (params.sortBy as string) || "createdAt",
      sortOrder: (params.sortOrder as string) || "desc",
    })
    const res = await fetch(`/api/admin/flashcard-decks?${search}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "โหลดข้อมูลชุดแฟลชการ์ดไม่สำเร็จ")
    return { items: data.data as AdminFlashcardDeck[], total: data.pagination.totalCount, page: data.pagination.page }
  }, [])

  const list = useAdminListState<AdminFlashcardDeck>({ fetcher, initialFilters: { subject: "all", gradeLevel: "all", status: "all" } })

  return {
    decks: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchDecks: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
