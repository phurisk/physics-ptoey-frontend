import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminMockQuestionOption = { id?: string; optionText: string; optionImage?: string | null; isCorrect: boolean; order: number }

export type AdminMockQuestion = {
  id: string
  mockExamId: string
  topicId?: string | null
  questionText: string
  questionImage?: string | null
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
  marks: number
  numericTolerance?: number | null
  explanation?: string | null
  explanationImages: string[]
  order: number
  options: AdminMockQuestionOption[]
  topic?: { id: string; name: string } | null
  _count?: { answers: number }
}

export function useMockExamQuestions(mockExamId: string) {
  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        mockExamId,
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        questionType: params.questionType && params.questionType !== "all" ? String(params.questionType) : "",
        topicId: params.topicId && params.topicId !== "all" ? String(params.topicId) : "",
        sortBy: (params.sortBy as string) || "order",
        sortOrder: (params.sortOrder as string) || "asc",
      })
      const res = await fetch(`/api/admin/mock-exam-questions?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลคำถามไม่สำเร็จ")
      return { items: data.data as AdminMockQuestion[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    [mockExamId]
  )

  const list = useAdminListState<AdminMockQuestion>({
    fetcher,
    defaultSortBy: "order",
    defaultSortOrder: "asc",
    initialFilters: { questionType: "all", topicId: "all" },
  })

  return {
    questions: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchQuestions: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
