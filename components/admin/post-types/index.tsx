"use client"
import { useState } from "react"
import { FolderOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

import PostTypeTable from "./PostTypeTable"
import PostTypeModal from "./PostTypeModal"
import DeleteModal from "./DeleteModal"

import { usePostTypes, type AdminPostType } from "@/hooks/admin/usePostTypes"

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "ACTIVE", label: "ใช้งาน" },
  { value: "INACTIVE", label: "ปิดใช้งาน" },
]

export default function PostTypesManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPostType | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [postTypeToDelete, setPostTypeToDelete] = useState<AdminPostType | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { postTypes, loading, filters, searchInput, setSearchInput, pagination, fetchPostTypes, handleFilterChange, handlePageChange, handleSortChange, resetFilters } =
    usePostTypes()

  const handleSubmitPostType = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/post-types/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/post-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขประเภทบทความสำเร็จ" : "สร้างประเภทบทความสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchPostTypes()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (postType: AdminPostType) => {
    setPostTypeToDelete(postType)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!postTypeToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/post-types/${postTypeToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบประเภทบทความสำเร็จ" })
        setDeleteModalOpen(false)
        setPostTypeToDelete(null)
        await fetchPostTypes()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบประเภทบทความ" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบประเภทบทความ" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setPostTypeToDelete(null)
  }

  const openModal = (record: AdminPostType | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<FolderOpen className="h-6 w-6" />}
      title="จัดการหมวดหมู่บทความ"
      subtitle="สร้างและจัดการประเภทของบทความ"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างประเภทใหม่
        </Button>
      }
    >
      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ค้นหาชื่อประเภทหรือรายละเอียด..."
        selects={[{ key: "status", value: filters.status as string, onChange: (v) => handleFilterChange("status", v), placeholder: "สถานะ", options: STATUS_OPTIONS }]}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={postTypes.length}
        loading={loading}
        activeSummary={[
          filters.search && `ค้นหา: "${filters.search}"`,
          filters.status !== "ALL" && `สถานะ: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}`,
        ]}
      />

      <PostTypeTable
        postTypes={postTypes}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <PostTypeModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitPostType} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} postType={postTypeToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
