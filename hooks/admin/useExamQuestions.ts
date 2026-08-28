"use client"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export type AdminQuestionOption = {
  id: string
  optionText: string
  isCorrect: boolean
  order: number
}

export type AdminQuestion = {
  id: string
  examId: string
  questionText: string
  questionImage?: string | null
  questionType: string
  marks: number
  explanation?: string | null
  options: AdminQuestionOption[]
}

export type AdminQuestionExam = { id: string; title: string }

/**
 * Question-list state for a single exam's question editor. Unlike the other
 * admin list pages, this isn't paginated/filterable — an exam's question
 * count is small and the whole list is managed inline in one page, so a
 * plain fetch-on-mount hook fits better than useAdminListState here.
 */
export function useExamQuestions(examId: string) {
  const { toast } = useToast()
  const [exam, setExam] = useState<AdminQuestionExam | null>(null)
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`)
      const data = await res.json()
      if (!data.success) {
        setNotFound(true)
        throw new Error(data.error || "โหลดข้อมูลคำถามไม่สำเร็จ")
      }
      setExam(data.data.exam)
      setQuestions(data.data.questions)
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
    } finally {
      setLoading(false)
    }
  }, [examId, toast])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  return { exam, questions, loading, notFound, fetchQuestions }
}
