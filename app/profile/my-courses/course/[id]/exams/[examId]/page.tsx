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
  title?: string
  description?: string | null
  type?: string
  timeLimit?: number | null
  questions?: Question[]
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
        const data = json.data || (json as any).exam || null
        if (active) setExam(data)
      } catch (e: any) {
        if (active) setError(e?.message || "โหลดข้อสอบไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [courseId, examId, user?.id])

  const qList = useMemo(() => Array.isArray(exam?.questions) ? exam!.questions! : [], [exam?.questions])
  const title = exam?.title || "ข้อสอบ"
  const typeBadge = (t?: string) => {
    const x = (t || "").toUpperCase()
    if (x === "PRETEST") return <Badge className="bg-blue-600 text-white">Pre-test</Badge>
    if (x === "POSTTEST") return <Badge className="bg-green-600 text-white">Post-test</Badge>
    return <Badge className="bg-amber-500 text-white">แบบทดสอบ</Badge>
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
              {typeBadge(exam.type)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exam.description && (
              <div className="text-sm text-gray-700">{exam.description}</div>
            )}

            <div className="space-y-4">
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

