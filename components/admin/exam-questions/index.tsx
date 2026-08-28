"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ListChecks, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import QuestionTable from "./QuestionTable"
import QuestionModal from "./QuestionModal"
import DeleteModal from "./DeleteModal"

import { useExamQuestions, type AdminQuestion } from "@/hooks/admin/useExamQuestions"

export default function ExamQuestionsManagement({ examId }: { examId: string }) {
  const { toast } = useToast()
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminQuestion | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<AdminQuestion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { exam, questions, loading, notFound, fetchQuestions } = useExamQuestions(examId)

  const handleSubmitQuestion = async (questionData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/exams/${examId}/questions/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
          })
        : await fetch(`/api/admin/exams/${examId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขคำถามสำเร็จ" : "เพิ่มคำถามสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchQuestions()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (question: AdminQuestion) => {
    setQuestionToDelete(question)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!questionToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions/${questionToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบคำถามสำเร็จ" })
        setDeleteModalOpen(false)
        setQuestionToDelete(null)
        await fetchQuestions()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบคำถาม" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบคำถาม" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setQuestionToDelete(null)
  }

  const openModal = (record: AdminQuestion | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  if (notFound) {
    return (
      <AdminPageHeader icon={<ListChecks className="h-6 w-6" />} title="ไม่พบข้อสอบ" onBack={() => router.push("/admin/exams")} />
    )
  }

  return (
    <AdminPageHeader
      icon={<ListChecks className="h-6 w-6" />}
      title={exam ? `จัดการคำถาม: ${exam.title}` : <Skeleton className="h-6 w-48" />}
      subtitle="เพิ่ม แก้ไข หรือลบคำถามของข้อสอบนี้ พร้อมกำหนดตัวเลือกและเฉลย"
      onBack={() => router.push("/admin/exams")}
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มคำถามใหม่
        </Button>
      }
    >
      <QuestionTable questions={questions} loading={loading} onEdit={openModal} onDelete={handleDelete} />

      <QuestionModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitQuestion} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} question={questionToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
