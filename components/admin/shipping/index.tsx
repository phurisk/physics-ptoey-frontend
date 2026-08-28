"use client"
import { useState } from "react"
import { Truck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import ShippingFilters from "./ShippingFilters"
import ShippingTable from "./ShippingTable"
import EditModal from "./EditModal"

import { useShipping, type AdminShipping } from "@/hooks/admin/useShipping"

export default function ShippingManagement() {
  const { toast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminShipping | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    shipments,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchShipments,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useShipping()

  const handleSubmit = async (data: { status: string; shippingMethod: string; trackingNumber: string }) => {
    if (!editing) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/shipping/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: "บันทึกสำเร็จ" })
      setEditOpen(false)
      setEditing(null)
      fetchShipments()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<Truck className="h-6 w-6" />}
      title="การจัดส่ง"
      subtitle="ติดตามและอัปเดตสถานะการจัดส่งสินค้าที่ต้องส่งไปรษณีย์"
      actions={
        <Button variant="outline" onClick={() => fetchShipments()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      }
    >
      <ShippingFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={shipments.length}
        loading={loading}
      />

      <ShippingTable
        shipments={shipments}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={(s) => {
          setEditing(s)
          setEditOpen(true)
        }}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <EditModal open={editOpen} shipping={editing} submitting={submitting} onOpenChange={setEditOpen} onSubmit={handleSubmit} />
    </AdminPageHeader>
  )
}
