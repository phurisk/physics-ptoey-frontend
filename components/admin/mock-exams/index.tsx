"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileQuestion, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import MockExamFilters from "./MockExamFilters"
import MockExamTable from "./MockExamTable"
import MockExamModal from "./MockExamModal"
import DeleteModal from "./DeleteModal"

import { useMockExams, type AdminMockExam } from "@/hooks/admin/useMockExams"

export default function MockExamsManagement() {
  const { toast } = useToast()
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminMockExam | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminMockExam | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    exams,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchExams,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useMockExams()

  const openModal = (exam: AdminMockExam | null) => {
    setEditing(exam)
    setModalOpen(true)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/mock-exams/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/mock-exams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: editing ? "แก้ไขข้อสอบจำลองสำเร็จ" : "สร้างข้อสอบจำลองสำเร็จ" })
      setModalOpen(false)
      setEditing(null)
      fetchExams()
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
      const res = await fetch(`/api/admin/mock-exams/${deleting.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบข้อสอบจำลองสำเร็จ" })
      setDeleteOpen(false)
      setDeleting(null)
      fetchExams()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<FileQuestion className="h-6 w-6" />}
      title="ข้อสอบจำลอง (Mock Exam)"
      subtitle="จัดการข้อสอบจำลองสำหรับโหมดฝึกซ้อมและสอบจริง"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างข้อสอบจำลองใหม่
        </Button>
      }
    >
      <MockExamFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={exams.length}
        loading={loading}
      />

      <MockExamTable
        exams={exams}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onManageQuestions={(exam) => router.push(`/admin/mock-exams/questions/${exam.id}`)}
        onViewAnalytics={(exam) => router.push(`/admin/mock-exams/analytics/${exam.id}`)}
        onDelete={(exam) => {
          setDeleting(exam)
          setDeleteOpen(true)
        }}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <MockExamModal open={modalOpen} editing={editing} submitting={submitting} onOpenChange={setModalOpen} onSubmit={handleSubmit} />
      <DeleteModal open={deleteOpen} exam={deleting} loading={deleteLoading} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </AdminPageHeader>
  )
}
