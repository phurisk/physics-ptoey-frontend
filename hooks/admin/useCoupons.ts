"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminCouponCategory = { id: string; categoryId: string }
export type AdminCouponItem = { id: string; itemType: "COURSE" | "EBOOK"; itemId: string }

export type AdminCoupon = {
  id: string
  code: string
  name: string
  description?: string | null
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"
  value: number
  minOrderAmount?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  usageCount: number
  userUsageLimit?: number | null
  isActive: boolean
  validFrom: string
  validUntil: string
  applicableType: "ALL" | "COURSE_ONLY" | "EBOOK_ONLY" | "CATEGORY" | "SPECIFIC_ITEM"
  createdAt: string
  updatedAt: string
  categories?: AdminCouponCategory[]
  items?: AdminCouponItem[]
  usedCount?: number
  orderCount?: number
  usagePercentage?: number
  isExpired?: boolean
  daysLeft?: number
}

export function useCoupons() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [ebooks, setEbooks] = useState<{ id: string; title: string }[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        type: params.type && params.type !== "all" ? String(params.type) : "",
        status: (params.status as string) || "all",
        applicableType: params.applicableType && params.applicableType !== "all" ? String(params.applicableType) : "",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })

      const res = await fetch(`/api/admin/coupons?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลคูปองไม่สำเร็จ")

      return { items: data.data as AdminCoupon[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminCoupon>({
    fetcher,
    initialFilters: { type: "all", status: "all", applicableType: "all" },
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

  const fetchItemOptions = useCallback(async () => {
    setItemsLoading(true)
    try {
      const [coursesRes, ebooksRes] = await Promise.all([
        fetch("/api/admin/courses?pageSize=200"),
        fetch("/api/ebooks?limit=200"),
      ])
      const coursesData = await coursesRes.json()
      const ebooksData = await ebooksRes.json()
      setCourses((coursesData.data || []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })))
      setEbooks((ebooksData.data || []).map((e: { id: string; title: string }) => ({ id: e.id, title: e.title })))
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลคอร์ส/อีบุ๊กไม่สำเร็จ" })
    } finally {
      setItemsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
    fetchItemOptions()
  }, [fetchCategories, fetchItemOptions])

  return {
    coupons: list.items,
    loading: list.loading,
    categories,
    catLoading,
    courses,
    ebooks,
    itemsLoading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchCoupons: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    handleSortSelectChange: list.handleSortSelectChange,
    resetFilters: list.resetFilters,
  }
}
