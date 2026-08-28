"use client"
import { useState } from "react"
import { BookText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import EbookFilters from "./EbookFilters"
import EbookTable from "./EbookTable"
import EbookModal from "./EbookModal"
import DeleteModal from "./DeleteModal"

import { useEbooks, type AdminEbook } from "@/hooks/admin/useEbooks"

export default function EbooksManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminEbook | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [ebookToDelete, setEbookToDelete] = useState<AdminEbook | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    ebooks,
    loading,
    categories,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchEbooks,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useEbooks()

  const handleSubmitEbook = async (ebookData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/ebooks/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ebookData),
          })
        : await fetch("/api/admin/ebooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ebookData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขอีบุ๊กสำเร็จ" : "สร้างอีบุ๊กสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchEbooks()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (ebook: AdminEbook) => {
    setEbookToDelete(ebook)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!ebookToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/ebooks/${ebookToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบอีบุ๊กสำเร็จ" })
        setDeleteModalOpen(false)
        setEbookToDelete(null)
        await fetchEbooks()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบอีบุ๊ก" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบอีบุ๊ก" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setEbookToDelete(null)
  }

  const openModal = (record: AdminEbook | null) => {
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
      title="จัดการอีบุ๊ก"
      subtitle="สร้างและจัดการอีบุ๊กสำหรับจำหน่าย"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างอีบุ๊กใหม่
        </Button>
      }
    >
      <EbookFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        categories={categories}
        totalCount={pagination.total}
        currentCount={ebooks.length}
        loading={loading}
      />

      <EbookTable
        ebooks={ebooks}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <EbookModal
        open={modalOpen}
        editing={editing}
        onCancel={closeModal}
        onSubmit={handleSubmitEbook}
        categories={categories}
        submitting={submitting}
      />

      <DeleteModal open={deleteModalOpen} ebook={ebookToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
