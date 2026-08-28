import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminFlashcardOption = { id?: string; optionText: string; isCorrect: boolean; order: number }

export type AdminFlashcard = {
  id: string
  deckId: string
  front: string
  frontImage?: string | null
  back: string
  backImage?: string | null
  hint?: string | null
  order: number
  answerMode: "SELF_GRADE" | "MULTIPLE_CHOICE" | "TYPED"
  acceptedAnswers: string[]
  numericTolerance?: number | null
  options: AdminFlashcardOption[]
}

export function useFlashcards(deckId: string) {
  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        deckId,
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        answerMode: params.answerMode && params.answerMode !== "all" ? String(params.answerMode) : "",
        sortBy: (params.sortBy as string) || "order",
        sortOrder: (params.sortOrder as string) || "asc",
      })
      const res = await fetch(`/api/admin/flashcards?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลการ์ดไม่สำเร็จ")
      return { items: data.data as AdminFlashcard[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    [deckId]
  )

  const list = useAdminListState<AdminFlashcard>({
    fetcher,
    defaultSortBy: "order",
    defaultSortOrder: "asc",
    initialFilters: { answerMode: "all" },
  })

  return {
    cards: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchCards: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
