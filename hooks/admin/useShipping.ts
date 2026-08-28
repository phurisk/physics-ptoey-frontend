import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminShipping = {
  id: string
  orderId: string
  name: string
  phone: string
  address: string
  district: string
  province: string
  postalCode: string
  shippingMethod: string
  status: string
  trackingNumber?: string | null
  createdAt: string
  order: { id: string; orderNumber: string; user: { name: string | null; email: string | null } }
}

export function useShipping() {
  const fetcher = useCallback(async (params: Record<string, unknown>) => {
    const search = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.limit),
      search: (params.search as string) || "",
      status: (params.status as string) || "ALL",
      shippingMethod: (params.shippingMethod as string) || "ALL",
      sortBy: (params.sortBy as string) || "createdAt",
      sortOrder: (params.sortOrder as string) || "desc",
    })
    const res = await fetch(`/api/admin/shipping?${search}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "โหลดข้อมูลการจัดส่งไม่สำเร็จ")
    return { items: data.data as AdminShipping[], total: data.pagination.totalCount, page: data.pagination.page }
  }, [])

  const list = useAdminListState<AdminShipping>({ fetcher, initialFilters: { status: "ALL", shippingMethod: "ALL" } })

  return {
    shipments: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchShipments: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
