"use client"
import { useState } from "react"
import { ShoppingCart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import OrderFilters from "./OrderFilters"
import OrderTable from "./OrderTable"
import OrderDetailModal from "./OrderDetailModal"

import { useOrders, type AdminOrder } from "@/hooks/admin/useOrders"

export default function OrdersManagement() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const {
    orders,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchOrders,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useOrders()

  const openDetail = (order: AdminOrder) => {
    setSelectedOrderId(order.id)
    setDetailOpen(true)
  }

  return (
    <AdminPageHeader
      icon={<ShoppingCart className="h-6 w-6" />}
      title="คำสั่งซื้อและการชำระเงิน"
      subtitle="ตรวจสอบคำสั่งซื้อ อนุมัติ/ปฏิเสธการชำระเงิน และจัดการการจัดส่ง"
      actions={
        <Button variant="outline" onClick={() => fetchOrders()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      }
    >
      <OrderFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={orders.length}
        loading={loading}
      />

      <OrderTable
        orders={orders}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onViewDetail={openDetail}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <OrderDetailModal
        open={detailOpen}
        orderId={selectedOrderId}
        onOpenChange={setDetailOpen}
        onActionSuccess={fetchOrders}
      />
    </AdminPageHeader>
  )
}
