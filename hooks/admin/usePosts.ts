"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminPost = {
  id: string
  title: string
  content?: string | null
  excerpt?: string | null
  imageUrl?: string | null
  imageUrlMobileMode?: string | null
  slug?: string | null
  isActive: boolean
  isFeatured: boolean
  publishedAt?: string | null
  authorId: string
  postTypeId: string
  createdAt: string
  updatedAt: string
  author?: { id: string; name: string | null; email: string | null } | null
  postType?: { id: string; name: string } | null
  _count?: { postContents: number }
}

export function usePosts() {
  const { toast } = useToast()
  const [postTypes, setPostTypes] = useState<{ id: string; name: string }[]>([])
  const [postTypesLoading, setPostTypesLoading] = useState(false)

  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        postTypeId: params.postTypeId && params.postTypeId !== "all" ? String(params.postTypeId) : "",
        isActive: params.isActive && params.isActive !== "all" ? String(params.isActive) : "",
        isFeatured: params.isFeatured === "true" ? "true" : "",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })
      if (params.dateFrom) search.set("dateFrom", String(params.dateFrom))
      if (params.dateTo) search.set("dateTo", String(params.dateTo))

      const res = await fetch(`/api/admin/posts?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลบทความไม่สำเร็จ")

      return { items: data.data as AdminPost[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminPost>({
    fetcher,
    initialFilters: { postTypeId: "all", isActive: "all", isFeatured: "", dateFrom: "", dateTo: "" },
  })

  const fetchPostTypes = useCallback(async () => {
    setPostTypesLoading(true)
    try {
      const res = await fetch("/api/admin/post-types?pageSize=100")
      const data = await res.json()
      setPostTypes(data.data || [])
    } catch {
      toast({ variant: "destructive", title: "โหลดข้อมูลประเภทบทความไม่สำเร็จ" })
    } finally {
      setPostTypesLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPostTypes()
  }, [fetchPostTypes])

  return {
    posts: list.items,
    loading: list.loading,
    postTypes,
    postTypesLoading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchPosts: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    handleSortSelectChange: list.handleSortSelectChange,
    resetFilters: list.resetFilters,
  }
}
