"use client"
import { useState } from "react"
import { GraduationCap, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import { useToast } from "@/hooks/use-toast"

import EnrollmentFilters from "./EnrollmentFilters"
import EnrollmentTable from "./EnrollmentTable"
import EditModal from "./EditModal"
import DeleteModal from "./DeleteModal"

import { useEnrollments, type AdminEnrollment } from "@/hooks/admin/useEnrollments"

export default function EnrollmentsManagement() {
  const { toast } = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminEnrollment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminEnrollment | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    enrollments,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchEnrollments,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useEnrollments()

  const openEdit = (enrollment: AdminEnrollment) => {
    setEditing(enrollment)
    setEditOpen(true)
  }

  const openDelete = (enrollment: AdminEnrollment) => {
    setDeleting(enrollment)
    setDeleteOpen(true)
  }

  const handleSubmitEdit = async (data: { status: string; accessDuration: string; accessHours: string }) => {
    if (!editing) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/enrollments/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: "บันทึกสำเร็จ" })
      setEditOpen(false)
      setEditing(null)
      fetchEnrollments()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/enrollments/${deleting.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ยกเลิกไม่สำเร็จ")
      toast({ title: "ยกเลิกการลงทะเบียนสำเร็จ" })
      setDeleteOpen(false)
      setDeleting(null)
      fetchEnrollments()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ยกเลิกไม่สำเร็จ" })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<GraduationCap className="h-6 w-6" />}
      title="การลงทะเบียนเรียน"
      subtitle="ติดตามความคืบหน้า แก้ไขสถานะ หรือยกเลิกการลงทะเบียนของผู้เรียน"
      actions={
        <Button variant="outline" onClick={() => fetchEnrollments()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      }
    >
      <EnrollmentFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={enrollments.length}
        loading={loading}
      />

      <EnrollmentTable
        enrollments={enrollments}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openEdit}
        onDelete={openDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <EditModal
        open={editOpen}
        enrollment={editing}
        submitting={submitting}
        onOpenChange={setEditOpen}
        onSubmit={handleSubmitEdit}
      />

      <DeleteModal
        open={deleteOpen}
        enrollment={deleting}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminPageHeader>
  )
}
