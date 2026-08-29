"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ListChecks, Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import MockQuestionFilters from "./MockQuestionFilters"
import MockQuestionTable from "./MockQuestionTable"
import MockQuestionModal from "./MockQuestionModal"
import DeleteModal from "./DeleteModal"

import { useMockExamQuestions, type AdminMockQuestion } from "@/hooks/admin/useMockExamQuestions"
import { fetchMockTopicsForSubject, type AdminMockTopic } from "@/hooks/admin/useMockTopics"
import { getSubjectLabel } from "@/lib/constants"

type ExamInfo = { id: string; title: string; subject: string; questions?: { marks: number }[]; _count?: { questions: number } }

export default function MockExamQuestionsManagement() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams<{ mockExamId: string }>()
  const mockExamId = params.mockExamId as string

  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [topics, setTopics] = useState<AdminMockTopic[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminMockQuestion | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminMockQuestion | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    questions,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchQuestions,
    handleFilterChange,
    handlePageChange,
    resetFilters,
  } = useMockExamQuestions(mockExamId)

  const refreshExamInfo = async () => {
    const res = await fetch(`/api/admin/mock-exams/${mockExamId}`)
    const json = await res.json()
    if (json.success) {
      setExam(json.data)
      const t = await fetchMockTopicsForSubject(json.data.subject)
      setTopics(t)
    }
  }

  useEffect(() => {
    refreshExamInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockExamId])

  const openModal = (question: AdminMockQuestion | null) => {
    setEditing(question)
    setModalOpen(true)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/mock-exam-questions/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/mock-exam-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, mockExamId }),
          })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: editing ? "แก้ไขคำถามสำเร็จ" : "เพิ่มคำถามสำเร็จ" })
      setModalOpen(false)
      setEditing(null)
      fetchQuestions()
      refreshExamInfo()
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
      const res = await fetch(`/api/admin/mock-exam-questions/${deleting.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบคำถามสำเร็จ" })
      setDeleteOpen(false)
      setDeleting(null)
      fetchQuestions()
      refreshExamInfo()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<ListChecks className="h-6 w-6" />}
      title="จัดการคำถาม"
      subtitle={
        exam ? (
          <span className="flex flex-wrap items-center gap-2">
            {exam.title}
            <Badge variant="outline">{getSubjectLabel(exam.subject)}</Badge>
            <Badge variant="secondary">{exam._count?.questions ?? 0} ข้อ</Badge>
            <Badge variant="secondary">{exam.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) ?? 0} คะแนนรวม</Badge>
          </span>
        ) : (
          "..."
        )
      }
      breadcrumbItems={[
        {
          href: "/admin/mock-exams",
          label: (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              ข้อสอบจำลอง
            </span>
          ),
        },
        {
          label: (
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              จัดการคำถาม
            </span>
          ),
        },
      ]}
      onBack={() => router.back()}
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มคำถามใหม่
        </Button>
      }
    >
      <MockQuestionFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={questions.length}
        loading={loading}
        topics={topics}
      />

      <MockQuestionTable
        questions={questions}
        loading={loading}
        pagination={pagination}
        onEdit={openModal}
        onDelete={(q) => {
          setDeleting(q)
          setDeleteOpen(true)
        }}
        onPageChange={handlePageChange}
      />

      <MockQuestionModal
        open={modalOpen}
        editing={editing}
        topics={topics}
        submitting={submitting}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />
      <DeleteModal open={deleteOpen} question={deleting} loading={deleteLoading} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </AdminPageHeader>
  )
}
