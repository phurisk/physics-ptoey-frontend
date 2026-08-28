"use client"
import { useState } from "react"
import { Ticket, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import CouponFilters from "./CouponFilters"
import CouponTable from "./CouponTable"
import CouponModal from "./CouponModal"
import DeleteModal from "./DeleteModal"

import { useCoupons, type AdminCoupon } from "@/hooks/admin/useCoupons"

export default function CouponsManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCoupon | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<AdminCoupon | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    coupons,
    loading,
    categories,
    courses,
    ebooks,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchCoupons,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useCoupons()

  const handleSubmitCoupon = async (couponData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/coupons/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(couponData),
          })
        : await fetch("/api/admin/coupons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(couponData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขคูปองสำเร็จ" : "สร้างคูปองสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchCoupons()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (coupon: AdminCoupon) => {
    setCouponToDelete(coupon)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!couponToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/coupons/${couponToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบคูปองสำเร็จ" })
        setDeleteModalOpen(false)
        setCouponToDelete(null)
        await fetchCoupons()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบคูปอง" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบคูปอง" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setCouponToDelete(null)
  }

  const handleToggleStatus = async (coupon: AdminCoupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: coupon.isActive ? "ปิดใช้งานคูปองสำเร็จ" : "เปิดใช้งานคูปองสำเร็จ" })
        fetchCoupons()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะคูปอง" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะคูปอง" })
    }
  }

  const openModal = (record: AdminCoupon | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<Ticket className="h-6 w-6" />}
      title="จัดการคูปองส่วนลด"
      subtitle="สร้างและจัดการคูปองส่วนลดสำหรับคอร์สเรียนและอีบุ๊ก"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างคูปองใหม่
        </Button>
      }
    >
      <CouponFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={coupons.length}
        loading={loading}
      />

      <CouponTable
        coupons={coupons}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <CouponModal
        open={modalOpen}
        editing={editing}
        onCancel={closeModal}
        onSubmit={handleSubmitCoupon}
        categories={categories}
        courses={courses}
        ebooks={ebooks}
        submitting={submitting}
      />

      <DeleteModal open={deleteModalOpen} coupon={couponToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
