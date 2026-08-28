"use client"
import { useState } from "react"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import ExamBankFilters from "./ExamBankFilters"
import ExamBankTable from "./ExamBankTable"
import ExamBankModal from "./ExamBankModal"
import DeleteModal from "./DeleteModal"

import { useExamBank, type AdminExamBank } from "@/hooks/admin/useExamBank"

export default function ExamBankManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminExamBank | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<AdminExamBank | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    exams,
    loading,
    categories,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchExams,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useExamBank()

  const handleSubmitExam = async (examData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/exam-bank/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(examData),
          })
        : await fetch("/api/admin/exam-bank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(examData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขข้อสอบสำเร็จ" : "สร้างข้อสอบสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchExams()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (exam: AdminExamBank) => {
    setExamToDelete(exam)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!examToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/exam-bank/${examToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบข้อสอบสำเร็จ" })
        setDeleteModalOpen(false)
        setExamToDelete(null)
        await fetchExams()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบข้อสอบ" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบข้อสอบ" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setExamToDelete(null)
  }

  const openModal = (record: AdminExamBank | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<FileText className="h-6 w-6" />}
      title="จัดการคลังข้อสอบ (ไฟล์)"
      subtitle="สร้างและจัดการรายการข้อสอบสำหรับดาวน์โหลด"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างข้อสอบใหม่
        </Button>
      }
    >
      <ExamBankFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        categories={categories}
        totalCount={pagination.total}
        currentCount={exams.length}
        loading={loading}
      />

      <ExamBankTable
        exams={exams}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <ExamBankModal
        open={modalOpen}
        editing={editing}
        onCancel={closeModal}
        onSubmit={handleSubmitExam}
        categories={categories}
        submitting={submitting}
      />

      <DeleteModal open={deleteModalOpen} exam={examToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
