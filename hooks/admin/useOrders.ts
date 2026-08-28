"use client"
import { useCallback } from "react"
import { useAdminListState } from "@/hooks/admin/useAdminListState"

export type AdminOrderItem = {
  id: string
  itemType: "COURSE" | "EBOOK"
  itemId: string
  title: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type AdminOrderPayment = {
  id: string
  method: string
  status: string
  amount: number
  slipUrl?: string | null
  ref?: string | null
  uploadedAt?: string | null
  verifiedAt?: string | null
  paidAt?: string | null
  notes?: string | null
  confidenceScore?: number | null
  validationPassed?: boolean | null
  detectedAmount?: number | null
  detectedDate?: string | null
  detectedSender?: string | null
  detectedReceiver?: string | null
  analysisError?: string | null
}

export type AdminOrderShipping = {
  id: string
  name: string
  phone: string
  address: string
  district: string
  province: string
  postalCode: string
  shippingMethod: string
  status: string
  trackingNumber?: string | null
}

export type AdminOrderCoupon = {
  id: string
  code: string
  name: string
  type: string
  value: number
}

export type AdminOrder = {
  id: string
  orderNumber: string
  userId: string
  status: string
  subtotal: number
  shippingFee: number
  tax: number
  discount: number
  couponDiscount: number
  total: number
  notes?: string | null
  couponCode?: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string | null; school?: string | null; lineId?: string | null; image?: string | null }
  items: AdminOrderItem[]
  payment: AdminOrderPayment | null
  shipping: AdminOrderShipping | null
  coupon?: AdminOrderCoupon | null
}

export function useOrders() {
  const fetcher = useCallback(
    async (params: Record<string, unknown>) => {
      const search = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.limit),
        search: (params.search as string) || "",
        status: (params.status as string) || "ALL",
        paymentStatus: (params.paymentStatus as string) || "ALL",
        sortBy: (params.sortBy as string) || "createdAt",
        sortOrder: (params.sortOrder as string) || "desc",
      })
      if (params.dateFrom) search.set("dateFrom", String(params.dateFrom))
      if (params.dateTo) search.set("dateTo", String(params.dateTo))

      const res = await fetch(`/api/admin/orders?${search}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ")

      return { items: data.data as AdminOrder[], total: data.pagination.totalCount, page: data.pagination.page }
    },
    []
  )

  const list = useAdminListState<AdminOrder>({
    fetcher,
    initialFilters: { status: "ALL", paymentStatus: "ALL", dateFrom: "", dateTo: "" },
  })

  return {
    orders: list.items,
    loading: list.loading,
    filters: list.filters,
    searchInput: list.searchInput,
    setSearchInput: list.setSearchInput,
    pagination: list.pagination,
    fetchOrders: list.fetchData,
    handleFilterChange: list.handleFilterChange,
    handlePageChange: list.handlePageChange,
    handleSortChange: list.handleSortChange,
    resetFilters: list.resetFilters,
  }
}
