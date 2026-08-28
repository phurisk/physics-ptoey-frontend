"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminExam = {
  id: string
  title: string
  description?: string | null
  courseId?: string | null
  examType: string
  timeLimit?: number | null
  totalMarks: number
  passingMarks: number
  attemptsAllowed: number
  showResults: boolean
  showAnswers: boolean
  isActive: boolean
  createdAt: string
  course?: { id: string; title: string } | null
  _count?: { questions: number; attempts: number }
}

export type AdminExamCourseOption = { id: string; title: string }

export function useExams() {
  const { toast } = useToast()
  const [courses, setCourses] = useState<AdminExamCourseOption[]>([])
  const [courseLoading, setCourseLoading] = useState(false)

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        courseId: params.courseId && params.courseId !== "all" ? String(params.courseId) : "",
        examType: params.examType && params.examType !== "all" ? String(params.examType) : "",
        isActive: params.isActive && params.isActive !== "all" ? String(params.isActive) : "",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })

      const res = await fetch(`/api/admin/exams?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลข้อสอบไม่สำเร็จ")

      return { items: data.data as AdminExam[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminExam>({
    fetcher,
    initialFilters: { courseId: "all", examType: "all", isActive: "all" },
  })

  const fetchCourses = useCallback(async () => {
    setCourseLoading(true)
    try {
      // Lightweight course lookup for the courseId <Select>, reusing the
      // existing paginated courses endpoint with a large page size (no
      // dedicated "all courses" endpoint exists yet).
      const res = await fetch("/api/admin/courses?pageSize=500&sortBy=title&sortOrder=asc")
      const data = await res.json()
      setCourses((data.data || []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })))
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลคอร์สไม่สำเร็จ" })
    } finally {
      setCourseLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return {
    exams: list.items,
    loading: list.loading,
    courses,
    courseLoading,
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
