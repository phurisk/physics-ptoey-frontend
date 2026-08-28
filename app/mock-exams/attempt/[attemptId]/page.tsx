"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Lock, Coins, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import http from "@/lib/http"

type Option = { id: string; optionText: string; isCorrect?: boolean }
type Question = {
  id: string
  order: number
  marks: number
  locked: boolean
  questionText?: string
  questionImage?: string | null
  questionType?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
  options?: Option[]
  explanation?: string | null
  answer?: { optionId?: string | null; textAnswer?: string | null; isCorrect?: boolean | null } | null
}

type AttemptData = {
  attemptId: string
  mode: "PRACTICE" | "REAL"
  exam: { id: string; title: string; timeLimit: number | null }
  questions: Question[]
  remainingSeconds: number | null
  practiceTokens: number | null
  practiceUnlockCost: number
}

function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function MockExamAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const router = useRouter()

  const [data, setData] = useState<AttemptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; textAnswer?: string; isCorrect?: boolean }>>({})
  const [unlocking, setUnlocking] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const submittedRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await http.get(`/api/mock-attempts/${attemptId}`)
      if (res.data?.success) {
        const d: AttemptData = res.data.data
        setData(d)
        setRemaining(d.remainingSeconds)
        const initialAnswers: typeof answers = {}
        d.questions.forEach((q) => {
          if (q.answer) initialAnswers[q.id] = { optionId: q.answer.optionId || undefined, textAnswer: q.answer.textAnswer || undefined }
        })
        setAnswers((prev) => ({ ...initialAnswers, ...prev }))
      } else {
        setError(res.data?.error || "โหลดข้อสอบไม่สำเร็จ")
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "โหลดข้อสอบไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [attemptId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      await http.post(`/api/mock-attempts/${attemptId}/submit`)
      router.push(`/mock-exams/attempt/${attemptId}/result`)
    } catch {
      submittedRef.current = false
      setSubmitting(false)
    }
  }, [attemptId, router])

  // Countdown for REAL-mode timed exams; auto-submit at zero.
  useEffect(() => {
    if (remaining == null) return
    if (remaining <= 0) {
      handleSubmit()
      return
    }
    const t = setInterval(() => setRemaining((r) => (r != null ? r - 1 : r)), 1000)
    return () => clearInterval(t)
  }, [remaining, handleSubmit])

  const saveAnswer = async (questionId: string, payload: { optionId?: string; textAnswer?: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...payload } }))
    try {
      const res = await http.post(`/api/mock-attempts/${attemptId}/answers`, { questionId, ...payload })
      if (res.data?.success && data?.mode === "PRACTICE") {
        setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], isCorrect: res.data.data.isCorrect } }))
      }
    } catch {
      // best-effort autosave; student can retry by re-selecting
    }
  }

  const unlockQuestion = async (questionId: string) => {
    setUnlocking(questionId)
    try {
      const res = await http.post(`/api/mock-attempts/${attemptId}/questions/${questionId}/unlock`)
      if (res.data?.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                practiceTokens: res.data.data.practiceTokens,
                questions: prev.questions.map((q) => (q.id === questionId ? res.data.data.question : q)),
              }
            : prev
        )
      }
    } finally {
      setUnlocking(null)
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">กำลังโหลดข้อสอบ...</div>
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-red-600">{error || "ไม่พบข้อมูล"}</div>

  const isPractice = data.mode === "PRACTICE"

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{data.exam.title}</h1>
          <Badge variant="outline" className="mt-1">
            {isPractice ? "โหมดฝึกซ้อม" : "โหมดสอบจริง"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {isPractice && data.practiceTokens != null && (
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
              <Coins className="h-4 w-4" />
              {data.practiceTokens} โทเคน
            </div>
          )}
          {remaining != null && (
            <div className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
              <Clock className="h-4 w-4" />
              {formatSeconds(remaining)}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {data.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">ข้อที่ {idx + 1}</span>
                <Badge variant="outline">{q.marks} คะแนน</Badge>
              </div>

              {q.locked ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">ใช้ {data.practiceUnlockCost} โทเคนเพื่อปลดล็อกคำถามนี้</p>
                  <Button size="sm" disabled={unlocking === q.id} onClick={() => unlockQuestion(q.id)}>
                    {unlocking === q.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                    ปลดล็อก
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-foreground">{q.questionText}</p>

                  {q.questionType === "SHORT_ANSWER" ? (
                    <Input
                      value={answers[q.id]?.textAnswer ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], textAnswer: e.target.value } }))}
                      onBlur={(e) => saveAnswer(q.id, { textAnswer: e.target.value })}
                      placeholder="พิมพ์คำตอบ..."
                    />
                  ) : (
                    <RadioGroup
                      value={answers[q.id]?.optionId ?? ""}
                      onValueChange={(v) => saveAnswer(q.id, { optionId: v })}
                      className="space-y-2"
                    >
                      {q.options?.map((opt) => {
                        const isSelected = answers[q.id]?.optionId === opt.id
                        const revealCorrectness = isPractice && answers[q.id]?.isCorrect != null && isSelected
                        return (
                          <div key={opt.id} className="flex items-center gap-2 rounded-md border p-2.5">
                            <RadioGroupItem value={opt.id} id={opt.id} />
                            <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal">
                              {opt.optionText}
                            </Label>
                            {revealCorrectness &&
                              (answers[q.id]?.isCorrect ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ))}
                          </div>
                        )
                      })}
                    </RadioGroup>
                  )}

                  {isPractice && q.explanation && answers[q.id]?.isCorrect != null && (
                    <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                      <strong>คำอธิบาย:</strong> {q.explanation}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          ส่งข้อสอบ
        </Button>
      </div>
    </div>
  )
}
