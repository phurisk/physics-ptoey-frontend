"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminCourse = {
  id: string
  title: string
  description?: string | null
  price: number
  discountPrice?: number | null
  sampleVideo?: string | null
  status: string
  instructorId: string
  categoryId?: string | null
  subject?: string | null
  gradeLevel?: string | null
  coverImageUrl?: string | null
  coverPublicId?: string | null
  isFree: boolean
  isPhysical: boolean
  isRecommended: boolean
  weight?: number | null
  dimensions?: string | null
  accessDuration?: number | null
  accessHours?: number | null
  instructor?: { id: string; name: string | null; email: string | null } | null
  category?: { id: string; name: string } | null
}

export function useCourses() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [instructors, setInstructors] = useState<{ id: string; name: string; email: string }[]>([])
  const [instLoading, setInstLoading] = useState(false)

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        status: (params.status as string) || "ALL",
        instructorId: params.instructorId && params.instructorId !== "all" ? String(params.instructorId) : "",
        categoryId: params.categoryId && params.categoryId !== "all" ? String(params.categoryId) : "",
        subject: params.subject && params.subject !== "all" ? String(params.subject) : "",
        gradeLevel: params.gradeLevel && params.gradeLevel !== "all" ? String(params.gradeLevel) : "",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })
      if (params.minPrice) search.set("minPrice", String(params.minPrice))
      if (params.maxPrice) search.set("maxPrice", String(params.maxPrice))

      const res = await fetch(`/api/admin/courses?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลคอร์สไม่สำเร็จ")

      return { items: data.data as AdminCourse[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminCourse>({
    fetcher,
    initialFilters: {
      status: "ALL",
      instructorId: "all",
      categoryId: "all",
      subject: "all",
      gradeLevel: "all",
      minPrice: "",
      maxPrice: "",
    },
  })

  const fetchCategories = useCallback(async () => {
    setCatLoading(true)
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      setCategories(data.data || [])
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ" })
    } finally {
      setCatLoading(false)
    }
  }, [toast])

  const fetchInstructors = useCallback(async () => {
    setInstLoading(true)
    try {
      const res = await fetch("/api/admin/users?role=INSTRUCTOR")
      const data = await res.json()
      setInstructors(data.data?.users || [])
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลผู้สอนไม่สำเร็จ" })
    } finally {
      setInstLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
    fetchInstructors()
  }, [fetchCategories, fetchInstructors])

  return {
    courses: list.items,
    loading: list.loading,
    categories,
    catLoading,
    instructors,
    instLoading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchCourses: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    handleSortSelectChange: list.handleSortSelectChange,
    resetFilters: list.resetFilters,
  }
}
