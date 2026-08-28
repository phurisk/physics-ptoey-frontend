"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminEbook = {
  id: string
  title: string
  description?: string | null
  author: string
  isbn?: string | null
  price: number
  discountPrice?: number | null
  coverImageUrl?: string | null
  previewUrl?: string | null
  fileUrl?: string | null
  fileSize?: number | null
  pageCount?: number | null
  language: string
  format: string
  isPhysical: boolean
  weight?: number | null
  dimensions?: string | null
  downloadLimit?: number | null
  accessDuration?: number | null
  isActive: boolean
  isFeatured: boolean
  publishedAt?: string | null
  publishedYear?: number | null
  categoryId?: string | null
  category?: { id: string; name: string } | null
  _count?: { reviews: number; downloads: number }
}

export function useEbooks() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [catLoading, setCatLoading] = useState(false)

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        status: (params.status as string) || "ALL",
        categoryId: params.categoryId && params.categoryId !== "all" ? String(params.categoryId) : "",
        format: params.format && params.format !== "all" ? String(params.format) : "",
        featured: (params.featured as string) || "ALL",
        physical: (params.physical as string) || "ALL",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })
      if (params.minPrice) search.set("minPrice", String(params.minPrice))
      if (params.maxPrice) search.set("maxPrice", String(params.maxPrice))

      const res = await fetch(`/api/admin/ebooks?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลอีบุ๊กไม่สำเร็จ")

      return { items: data.data as AdminEbook[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminEbook>({
    fetcher,
    initialFilters: {
      status: "ALL",
      categoryId: "all",
      format: "all",
      featured: "ALL",
      physical: "ALL",
      minPrice: "",
      maxPrice: "",
    },
  })

  const fetchCategories = useCallback(async () => {
    setCatLoading(true)
    try {
      const res = await fetch("/api/admin/ebook-categories")
      const data = await res.json()
      setCategories(data.data || [])
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลหมวดหมู่อีบุ๊กไม่สำเร็จ" })
    } finally {
      setCatLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    ebooks: list.items,
    loading: list.loading,
    categories,
    catLoading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchEbooks: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    handleSortSelectChange: list.handleSortSelectChange,
    resetFilters: list.resetFilters,
  }
}
