"use client"
import { useState } from "react"
import { BookText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

import EbookCategoryTable from "./EbookCategoryTable"
import EbookCategoryModal from "./EbookCategoryModal"
import DeleteModal from "./DeleteModal"

import { useEbookCategories, type AdminEbookCategory } from "@/hooks/admin/useEbookCategories"

export default function EbookCategoriesManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminEbookCategory | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminEbookCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { categories, totalCount, allCount, loading, searchInput, setSearchInput, page, pageSize, setPage, resetFilters, fetchCategories } =
    useEbookCategories()

  const handleSubmitCategory = async (categoryData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/ebook-categories/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryData),
          })
        : await fetch("/api/admin/ebook-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขหมวดหมู่สำเร็จ" : "สร้างหมวดหมู่สำเร็จ" })
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

  const handleDelete = (category: AdminEbookCategory) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/ebook-categories/${categoryToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบหมวดหมู่สำเร็จ" })
        setDeleteModalOpen(false)
        setCategoryToDelete(null)
        await fetchCategories()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบหมวดหมู่" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบหมวดหมู่" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setCategoryToDelete(null)
  }

  const openModal = (record: AdminEbookCategory | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<BookText className="h-6 w-6" />}
      title="จัดการหมวดหมู่อีบุ๊ก"
      subtitle="สร้างและจัดการหมวดหมู่สำหรับอีบุ๊ก"
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
        searchPlaceholder="ค้นหาชื่อหรือรายละเอียดหมวดหมู่..."
        onReset={resetFilters}
        totalCount={allCount}
        currentCount={totalCount}
        loading={loading}
        activeSummary={[searchInput && `ค้นหา: "${searchInput}"`]}
      />

      <EbookCategoryTable
        categories={categories}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      <EbookCategoryModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitCategory} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} category={categoryToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
