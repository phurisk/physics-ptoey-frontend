"use client"
import { useState } from "react"
import { Tag, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import ResultsCount from "@/components/admin/shared/ResultsCount"

import CategoryTable from "./CategoryTable"
import CategoryModal from "./CategoryModal"
import DeleteModal from "./DeleteModal"

import { useCategories, type AdminCategory } from "@/hooks/admin/useCategories"

export default function CategoriesManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { categories, totalCount, loading, searchInput, setSearchInput, fetchCategories } = useCategories()

  const handleSubmitCategory = async (categoryData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/categories/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryData),
          })
        : await fetch("/api/admin/categories", {
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

  const handleDelete = (category: AdminCategory) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, { method: "DELETE" })
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

  const openModal = (record: AdminCategory | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<Tag className="h-6 w-6" />}
      title="จัดการหมวดหมู่คอร์ส"
      subtitle="สร้างและจัดการหมวดหมู่สำหรับคอร์สเรียน"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างหมวดหมู่ใหม่
        </Button>
      }
    >
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="ค้นหาชื่อหมวดหมู่หรือรายละเอียด..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-3">
          <ResultsCount current={categories.length} total={totalCount} />
        </div>
      </div>

      <CategoryTable categories={categories} loading={loading} totalCount={categories.length} onEdit={openModal} onDelete={handleDelete} />

      <CategoryModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitCategory} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} category={categoryToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
