"use client"
import { useState } from "react"
import { FolderOpen, Plus, Search, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import ResultsCount from "@/components/admin/shared/ResultsCount"

import PostTypeTable from "./PostTypeTable"
import PostTypeModal from "./PostTypeModal"
import DeleteModal from "./DeleteModal"

import { usePostTypes, type AdminPostType } from "@/hooks/admin/usePostTypes"

export default function PostTypesManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPostType | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [postTypeToDelete, setPostTypeToDelete] = useState<AdminPostType | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { postTypes, loading, searchInput, setSearchInput, pagination, fetchPostTypes, handlePageChange } = usePostTypes()

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
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="ค้นหาชื่อประเภทหรือรายละเอียด..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <ResultsCount current={postTypes.length} total={pagination.total} />
          <Button variant="outline" size="sm" onClick={() => setSearchInput("")} disabled={loading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            ล้างการค้นหา
          </Button>
        </div>
      </div>

      <PostTypeTable
        postTypes={postTypes}
        loading={loading}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
      />

      <PostTypeModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitPostType} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} postType={postTypeToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
