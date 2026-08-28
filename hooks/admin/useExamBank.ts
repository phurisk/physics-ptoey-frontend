"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminExamFile = {
  id: string
  examId: string
  fileName: string
  filePath: string
  fileType?: string | null
  fileSize?: number | null
  isDownload: boolean
  uploadedAt: string
}

export type AdminExamBank = {
  id: string
  title: string
  description?: string | null
  categoryId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string } | null
  files: AdminExamFile[]
  _count?: { files: number }
}

export function useExamBank() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [catLoading, setCatLoading] = useState(false)

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        categoryId: params.categoryId && params.categoryId !== "all" ? String(params.categoryId) : "",
        isActive: params.isActive && params.isActive !== "all" ? String(params.isActive) : "",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })

      const res = await fetch(`/api/admin/exam-bank?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลคลังข้อสอบไม่สำเร็จ")

      return { items: data.data as AdminExamBank[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminExamBank>({
    fetcher,
    initialFilters: { categoryId: "all", isActive: "all" },
  })

  const fetchCategories = useCallback(async () => {
    setCatLoading(true)
    try {
      const res = await fetch("/api/admin/exam-categories?pageSize=100")
      const data = await res.json()
      setCategories(data.data || [])
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลหมวดหมู่ข้อสอบไม่สำเร็จ" })
    } finally {
      setCatLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    exams: list.items,
    loading: list.loading,
    categories,
    catLoading,
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
