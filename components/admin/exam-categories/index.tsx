"use client"
import { useState } from "react"
import { FolderOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

import ExamCategoryTable from "./Table"
import ExamCategoryModal from "./Modal"
import DeleteModal from "./DeleteModal"

import { useExamCategories, type AdminExamCategory } from "@/hooks/admin/useExamCategories"

export default function ExamCategoriesManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminExamCategory | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminExamCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    categories,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchCategories,
    resetFilters,
    handlePageChange,
    handleSortChange,
  } = useExamCategories()

  const handleSubmitCategory = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/exam-categories/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/exam-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขหมวดหมู่ข้อสอบสำเร็จ" : "สร้างหมวดหมู่ข้อสอบสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchCategories()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (category: AdminExamCategory) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/exam-categories/${categoryToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบหมวดหมู่ข้อสอบสำเร็จ" })
        setDeleteModalOpen(false)
        setCategoryToDelete(null)
        await fetchCategories()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบหมวดหมู่ข้อสอบ" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบหมวดหมู่ข้อสอบ" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setCategoryToDelete(null)
  }

  const openModal = (record: AdminExamCategory | null) => {
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
      title="จัดการหมวดหมู่ข้อสอบ"
      subtitle="สร้างและจัดการหมวดหมู่สำหรับคลังข้อสอบ"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างหมวดหมู่ใหม่
        </Button>
      }
    >
      <AdminFilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ค้นหาชื่อหมวดหมู่หรือรายละเอียด..."
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={categories.length}
        loading={loading}
        activeSummary={[filters.search && `ค้นหา: "${filters.search}"`]}
      />

      <ExamCategoryTable
        categories={categories}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <ExamCategoryModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitCategory} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} category={categoryToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
