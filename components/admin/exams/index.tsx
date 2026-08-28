"use client"
import { useState } from "react"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import ExamFilters from "./ExamFilters"
import ExamTable from "./ExamTable"
import ExamModal from "./ExamModal"
import DeleteModal from "./DeleteModal"

import { useExams, type AdminExam } from "@/hooks/admin/useExams"

export default function ExamsManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminExam | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<AdminExam | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    exams,
    loading,
    courses,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchExams,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useExams()

  const handleSubmitExam = async (examData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/exams/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(examData),
          })
        : await fetch("/api/admin/exams", {
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

  const handleDelete = (exam: AdminExam) => {
    setExamToDelete(exam)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!examToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/exams/${examToDelete.id}`, { method: "DELETE" })
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

  const openModal = (record: AdminExam | null) => {
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
      title="จัดการข้อสอบในคอร์ส"
      subtitle="สร้างและจัดการข้อสอบ/แบบทดสอบที่นักเรียนทำในคอร์ส (ตรวจให้คะแนนอัตโนมัติ)"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างข้อสอบใหม่
        </Button>
      }
    >
      <ExamFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        courses={courses}
        totalCount={pagination.total}
        currentCount={exams.length}
        loading={loading}
      />

      <ExamTable
        exams={exams}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <ExamModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitExam} courses={courses} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} exam={examToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
