"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"

type ExamDetail = {
  id: string
  title: string
  description?: string | null
  examType?: string
  duration?: number | null
  timeLimit?: number | null
  totalQuestions: number
  questions: Question[]
  status?: string | null
  canRetake?: boolean
  attemptId?: string
  startedAt?: string | null
}

type Question = {
  id: string
  text?: string
  type?: string // MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER
  options?: { id: string; text?: string }[]
}

type ExamDetailResponse = {
  success: boolean
  data?: ExamDetail
  exam?: ExamDetail
  error?: string
}

export default function ExamAttemptPage() {
  const { id: courseId, examId } = useParams<{ id: string; examId: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; textAnswer?: string }>>({})

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!courseId || !examId || !user?.id) { setLoading(false); return }
      try {
        setLoading(true)
        const res = await fetch(`/api/my-courses/course/${encodeURIComponent(String(courseId))}/exams/${encodeURIComponent(String(examId))}?userId=${encodeURIComponent(String(user.id))}`, { cache: "no-store" })
        const json: ExamDetailResponse = await res.json().catch(() => ({ success: false }))
        if (!res.ok || json.success === false) throw new Error(json?.error || `HTTP ${res.status}`)
        const payload = json.data || (json as any).exam || null

        let normalized: ExamDetail | null = null
        if (payload) {
          const examInfo = (payload as any).exam || payload
          const rawQuestions: any[] = Array.isArray((payload as any).questions)
            ? ((payload as any).questions as any[])
            : []

          const questions: Question[] = rawQuestions.map((q) => ({
            id: q.id,
            text: q.questionText ?? q.text ?? "",
            type: q.questionType ?? q.type,
            options: Array.isArray(q.options)
              ? q.options.map((opt: any) => ({
                  id: opt.id,
                  text: opt.optionText ?? opt.text ?? opt.label ?? opt.id,
                }))
              : [],
          }))

          normalized = {
            id: examInfo?.id ?? String(examId),
            title: examInfo?.title ?? payload?.title ?? "ข้อสอบ",
            description: examInfo?.description ?? payload?.description ?? null,
            examType: examInfo?.examType ?? examInfo?.type,
            duration: examInfo?.duration ?? null,
            timeLimit:
              examInfo?.timeLimit ?? examInfo?.duration ?? examInfo?.timeLimitMinutes ?? null,
            totalQuestions:
              typeof (payload as any).totalQuestions === "number"
                ? (payload as any).totalQuestions
                : questions.length,
            questions,
            status: (payload as any).status ?? examInfo?.status ?? null,
            canRetake: (payload as any).canRetake,
            attemptId: (payload as any).attemptId,
            startedAt: (payload as any).startedAt,
          }
        }

        if (active) setExam(normalized)
      } catch (e: any) {
        if (active) setError(e?.message || "โหลดข้อสอบไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [courseId, examId, user?.id])

  const qList = useMemo(() => exam?.questions ?? [], [exam?.questions])
  const title = exam?.title || "ข้อสอบ"
  const typeBadge = (t?: string) => {
    const x = (t || "").toUpperCase()
    if (x === "PRETEST") return <Badge className="bg-blue-600 text-white">Pre-test</Badge>
    if (x === "POSTTEST") return <Badge className="bg-green-600 text-white">Post-test</Badge>
    return <Badge className="bg-amber-500 text-white">แบบทดสอบ</Badge>
  }

  const statusBadge = (status?: string | null) => {
    const value = (status || "").toUpperCase()
    if (value === "PASSED") return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">ผ่านแล้ว</Badge>
    if (value === "FAILED") return <Badge className="bg-rose-100 text-rose-700 border border-rose-200">ไม่ผ่าน</Badge>
    if (value === "IN_PROGRESS") return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">กำลังทำ</Badge>
    if (value === "NOT_STARTED") return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">ยังไม่ได้ทำ</Badge>
    if (value) return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{value}</Badge>
    return null
  }

  const setChoice = (qid: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: { optionId } }))
  }
  const setText = (qid: string, textAnswer: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: { textAnswer } }))
  }

  const submit = async () => {
    if (!user?.id || !courseId || !examId) return
    try {
      setSubmitting(true)
      const payload = {
        userId: user.id,
        answers: qList.map((q) => ({
          questionId: q.id,
          optionId: answers[q.id]?.optionId,
          textAnswer: answers[q.id]?.textAnswer,
        })),
      }
      const res = await fetch(`/api/my-courses/course/${encodeURIComponent(String(courseId))}/exams/${encodeURIComponent(String(examId))}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const text = await res.text().catch(() => "")
      let json: any = null
      try { json = text ? JSON.parse(text) : null } catch {}
      if (!res.ok || json?.success === false) throw new Error(json?.error || (text && text.slice(0, 200)) || `HTTP ${res.status}`)
      const result = json?.result || json?.data || json
      const attemptId = result?.attemptId || result?.id
      if (attemptId) {
        router.replace(`/profile/my-courses/exam-results/${encodeURIComponent(String(attemptId))}`)
      } else {
        router.replace(`/profile/my-courses/exam-results`)
      }
    } catch (e: any) {
      setError(e?.message || "ส่งคำตอบไม่สำเร็จ")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-lg p-6 text-gray-700">โปรดเข้าสู่ระบบ</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ทำข้อสอบ</h1>
        <Button variant="outline" onClick={() => history.back()}>ย้อนกลับ</Button>
      </div>

      {loading && (
        <>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && exam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{title}</span>
              <div className="flex items-center gap-2">
                {statusBadge(exam.status)}
                {typeBadge(exam.examType)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exam.description && (
              <div className="text-sm text-gray-700">{exam.description}</div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
              {typeof exam.totalQuestions === "number" && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  ทั้งหมด {exam.totalQuestions} ข้อ
                </span>
              )}
              {exam.timeLimit != null && exam.timeLimit! > 0 && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  เวลา {exam.timeLimit} นาที
                </span>
              )}
              {typeof exam.canRetake === "boolean" && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {exam.canRetake ? "ทำซ้ำได้" : "ทำได้ครั้งเดียว"}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {qList.length === 0 && (
                <div className="text-sm text-gray-500">ข้อสอบนี้ยังไม่มีคำถาม</div>
              )}
              {qList.map((q, idx) => {
                const qType = (q.type || (Array.isArray(q.options) && q.options.length === 2 ? "TRUE_FALSE" : "MULTIPLE_CHOICE")).toUpperCase()
                return (
                  <div key={q.id} className="p-4 rounded-lg border bg-white">
                    <div className="font-medium mb-2">{idx + 1}. {q.text || "คำถาม"}</div>
                    {qType === "SHORT_ANSWER" ? (
                      <Input
                        placeholder="พิมพ์คำตอบของคุณ"
                        value={answers[q.id]?.textAnswer || ""}
                        onChange={(e) => setText(q.id, e.target.value)}
                      />
                    ) : (
                      <div className="space-y-2">
                        {(q.options || [
                          { id: "TRUE", text: "ถูก" },
                          { id: "FALSE", text: "ผิด" },
                        ]).map((opt) => (
                          <label key={opt.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              className="h-4 w-4"
                              checked={answers[q.id]?.optionId === opt.id}
                              onChange={() => setChoice(q.id, opt.id)}
                            />
                            <span className="text-sm text-gray-800">{opt.text || opt.id}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push(`/profile/my-courses/course/${encodeURIComponent(String(courseId))}/exams`)}>ยกเลิก</Button>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={submit} disabled={submitting}>
                {submitting ? "กำลังส่งคำตอบ..." : "ส่งคำตอบ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
