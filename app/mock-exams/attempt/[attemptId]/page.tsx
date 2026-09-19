"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Lock, Coins, Loader2, ZoomIn, PenLine } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import PdfAnswerSheet from "@/components/mock-exam/PdfAnswerSheet"
import AnswerPad from "@/components/mock-exam/AnswerPad"
import ExamProgressBar from "@/components/mock-exam/ExamProgressBar"
import ExamTimer from "@/components/mock-exam/ExamTimer"
import { optionLabelFor, type OptionLabelStyle } from "@/lib/mock-exam-option-label"
import { cn } from "@/lib/utils"
import http from "@/lib/http"

export type Option = { id: string; optionText: string; optionImage?: string | null; isCorrect?: boolean }
export type Question = {
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
  startedAt: string
  exam: { id: string; title: string; timeLimit: number | null; examPdfUrl?: string | null; optionLabelStyle?: OptionLabelStyle }
  questions: Question[]
  remainingSeconds: number | null
  practiceTokens: number | null
  practiceUnlockCost: number
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
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [padOpen, setPadOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const submittedRef = useRef(false)

  // The exam screen is a fixed-height app shell: the page itself must never
  // scroll — only the question column / PDF / answer panel scroll inside it.
  // Sizing alone isn't enough (100vh overshoots the visible area on mobile
  // browsers with a collapsing URL bar), so lock the document too.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = { html: html.style.overflow, body: body.style.overflow, overscroll: body.style.overscrollBehavior }
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.overscrollBehavior = "none"
    return () => {
      html.style.overflow = prev.html
      body.style.overflow = prev.body
      body.style.overscrollBehavior = prev.overscroll
    }
  }, [])

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

  // Plain elapsed-time stopwatch shown whenever there's no countdown to show
  // instead (practice mode, or a REAL exam with no time limit) — computed from
  // the attempt's actual start time so it's still correct after a refresh,
  // rather than restarting from zero.
  useEffect(() => {
    if (!data?.startedAt || remaining != null) return
    const startedAtMs = new Date(data.startedAt).getTime()
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [data?.startedAt, remaining])

  // Correctness is never revealed here, in either mode — only after the exam
  // is submitted, on the result page. Showing it live in practice mode let a
  // student swap answers until the checkmark went green, so every attempt
  // could be walked up to 100% before ever pressing "ส่งข้อสอบ".
  const saveAnswer = async (questionId: string, payload: { optionId?: string; textAnswer?: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...payload } }))
    try {
      await http.post(`/api/mock-attempts/${attemptId}/answers`, { questionId, ...payload })
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
  const isPdfMode = !!data.exam.examPdfUrl
  const answeredCount = data.questions.filter((q) => answers[q.id]?.optionId || answers[q.id]?.textAnswer).length

  return (
    // Locked to the viewport (minus the fixed navbar's own height — see
    // SiteMain's pt-16/pt-20) so the page itself never scrolls; only the
    // content column and pad below scroll on their own.
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl flex-col overflow-hidden px-4 py-4 lg:h-[calc(100dvh-5rem)] lg:py-6">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
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
          <Button type="button" size="sm" variant={padOpen ? "default" : "outline"} onClick={() => setPadOpen((v) => !v)}>
            <PenLine className="mr-1.5 h-4 w-4" />
            กระดาษร่าง
          </Button>
        </div>
      </div>

      <div className="shrink-0">
        {remaining != null ? (
          <ExamTimer seconds={remaining} label="เวลาที่เหลือ" warning={remaining <= 300} />
        ) : (
          <ExamTimer seconds={elapsed} label={isPractice ? "เวลาที่ใช้ไป (ฝึกซ้อม)" : "เวลาที่ใช้ไป"} />
        )}
      </div>

      <div className={`min-h-0 flex-1 ${padOpen ? "grid grid-cols-1 grid-rows-[minmax(0,1fr)_16rem] gap-4 md:grid-cols-[1fr_340px] md:grid-rows-[minmax(0,1fr)]" : "flex flex-col"}`}>
        {/* Typed-question mode scrolls this column. PDF mode fills it and lets
            the PDF viewer / answer panel scroll on their own instead. */}
        <div className={`min-h-0 flex-1 ${isPdfMode ? "" : "overflow-y-auto"}`}>
          {isPdfMode ? (
            <PdfAnswerSheet
              examPdfUrl={data.exam.examPdfUrl!}
              questions={data.questions}
              answers={answers}
              practiceUnlockCost={data.practiceUnlockCost}
              optionLabelStyle={data.exam.optionLabelStyle}
              unlocking={unlocking}
              onTextChange={(questionId, value) => setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], textAnswer: value } }))}
              onSaveAnswer={saveAnswer}
              onUnlock={unlockQuestion}
            />
          ) : (
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
                        {q.questionImage && (
                          <button type="button" onClick={() => setPreviewImage(q.questionImage!)} className="group relative mb-3 block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={q.questionImage} alt="" className="max-w-full rounded-md border" />
                            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                              <ZoomIn className="h-6 w-6 text-white" />
                            </span>
                          </button>
                        )}
                        <p className="mb-4 text-foreground">{q.questionText}</p>

                        {q.questionType === "SHORT_ANSWER" ? (
                          <Input
                            value={answers[q.id]?.textAnswer ?? ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], textAnswer: e.target.value } }))}
                            onBlur={(e) => saveAnswer(q.id, { textAnswer: e.target.value })}
                            placeholder="พิมพ์คำตอบ..."
                          />
                        ) : (
                          <div role="radiogroup" className="space-y-2">
                            {q.options?.map((opt, optIdx) => {
                              const selected = answers[q.id]?.optionId === opt.id
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  onClick={() => saveAnswer(q.id, { optionId: opt.id })}
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-md border p-2.5 text-left transition-colors",
                                    selected ? "border-[#004B7D] bg-[#004B7D0D]" : "border-gray-200 hover:bg-gray-50"
                                  )}
                                >
                                  {/* A filled numbered/lettered bubble, like a real answer sheet — not a
                                      plain radio dot — per the exam's optionLabelStyle setting. */}
                                  <span
                                    className={cn(
                                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                                      selected ? "border-[#004B7D] bg-[#004B7D] text-white" : "border-gray-300 text-gray-600"
                                    )}
                                  >
                                    {optionLabelFor(optIdx, data.exam.optionLabelStyle)}
                                  </span>
                                  {opt.optionImage && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewImage(opt.optionImage!)
                                      }}
                                      className="shrink-0"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={opt.optionImage} alt="" className="h-14 w-20 rounded-md border object-cover" />
                                    </span>
                                  )}
                                  <span className="flex-1">{opt.optionText}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}

              <ExamProgressBar answered={answeredCount} total={data.questions.length} />
            </div>
          )}
        </div>

        {padOpen && (
          <div className="min-h-0">
            <AnswerPad />
          </div>
        )}
      </div>

      <div className="mt-4 flex shrink-0 justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          ส่งข้อสอบ
        </Button>
      </div>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">รูปภาพขยาย</DialogTitle>
          {previewImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage} alt="" className="max-h-[85vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
