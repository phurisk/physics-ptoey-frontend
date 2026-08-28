import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

type Filters = Record<string, unknown> & { search: string; sortBy: string; sortOrder: string }

type FetchResult<T> = { items: T[]; total: number; page?: number; meta?: unknown }

/**
 * Generic list-page state for admin sections: debounced search + filters +
 * sortable columns + server-side pagination + fetch — the same shape every
 * admin list page needs (Users, Courses, Orders, ...), wired the loop-safe
 * way.
 *
 * IMPORTANT: the final effect depends only on `fetchData`, never on the
 * whole `pagination`/`filters` object — fetchData is a useCallback that only
 * gets a new reference when a primitive it closes over actually changes.
 */
export function useAdminListState<T>({
  fetcher,
  initialFilters = {},
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
  pageSize = 10,
  searchDebounceMs = 500,
}: {
  fetcher: (params: { page: number; limit: number } & Record<string, unknown>) => Promise<FetchResult<T>>
  initialFilters?: Record<string, unknown>
  defaultSortBy?: string
  defaultSortOrder?: string
  pageSize?: number
  searchDebounceMs?: number
}) {
  const { toast } = useToast()
  const [items, setItems] = useState<T[]>([])
  const [meta, setMeta] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")

  const [filters, setFilters] = useState<Filters>({
    search: "",
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
    ...initialFilters,
  })

  const [pagination, setPagination] = useState({ current: 1, pageSize, total: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetcher({ page: pagination.current, limit: pagination.pageSize, ...filters })
      setItems(result.items || [])
      setMeta(result.meta ?? null)
      setPagination((prev) => ({ ...prev, total: result.total ?? 0, current: result.page ?? prev.current }))
    } catch (error) {
      console.error("Fetch list error:", error)
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, filters, pagination.current, pagination.pageSize])

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, current: 1 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, current: page }))
  }, [])

  const handleSortChange = useCallback((field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
    }))
    setPagination((prev) => ({ ...prev, current: 1 }))
  }, [])

  const handleSortSelectChange = useCallback((combinedValue: string) => {
    const [sortBy, sortOrder] = combinedValue.split("-")
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }))
    setPagination((prev) => ({ ...prev, current: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ search: "", sortBy: defaultSortBy, sortOrder: defaultSortOrder, ...initialFilters })
    setSearchInput("")
    setPagination((prev) => ({ ...prev, current: 1 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange("search", searchInput)
    }, searchDebounceMs)
    return () => clearTimeout(timer)
  }, [searchInput, handleFilterChange, searchDebounceMs])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    items,
    meta,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchData,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    handleSortSelectChange,
    resetFilters,
  }
}
