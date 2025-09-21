"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"

type ExamDetail = {
  id: string
  title: string
  description?: string | null
  examType?: string
  duration?: number | null
  timeLimit?: number | null
  totalQuestions: number
  totalMarks?: number | null
  passingMarks?: number | null
  attemptsAllowed?: number | null
  showResults?: boolean
  showAnswers?: boolean
  courseTitle?: string | null
  questions: Question[]
  status?: string | null
  canRetake?: boolean
  attemptId?: string
  startedAt?: string | null
}

type Question = {
  id: string
  text?: string
  image?: string | null
  marks?: number | null
  type?: string 
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
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number | null>(null)
  const autoSubmitTriggered = useRef(false)
  const { toast } = useToast()

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
            image: q.questionImage ?? q.image ?? null,
            marks: typeof q.marks === "number" ? q.marks : null,
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
            totalMarks:
              typeof (payload as any).totalMarks === "number"
                ? (payload as any).totalMarks
                : examInfo?.totalMarks ?? null,
            passingMarks:
              typeof (payload as any).passingMarks === "number"
                ? (payload as any).passingMarks
                : examInfo?.passingMarks ?? null,
            attemptsAllowed:
              typeof (payload as any).attemptsAllowed === "number"
                ? (payload as any).attemptsAllowed
                : examInfo?.attemptsAllowed ?? null,
            showResults:
              (payload as any).showResults ?? examInfo?.showResults ?? undefined,
            showAnswers:
              (payload as any).showAnswers ?? examInfo?.showAnswers ?? undefined,
            courseTitle:
              (examInfo as any)?.course?.title ?? (payload as any)?.course?.title ?? null,
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
  const totalQuestions = exam?.totalQuestions ?? qList.length
  const answeredCount = useMemo(
    () =>
      qList.reduce((count, q) => {
        const answer = answers[q.id]
        if (!answer) return count
        if (answer.optionId || (answer.textAnswer && answer.textAnswer.trim().length > 0)) {
          return count + 1
        }
        return count
      }, 0),
    [answers, qList]
  )
  const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
  const timeLimitMinutes = exam?.timeLimit ?? exam?.duration ?? null
  const startedAtDisplay = useMemo(
    () => (exam?.startedAt ? new Date(exam.startedAt).toLocaleString("th-TH") : null),
    [exam?.startedAt]
  )
  const finishAtDisplay = useMemo(() => {
    if (!timeLimitMinutes) return null
    const base = exam?.startedAt ? new Date(exam.startedAt).getTime() : Date.now()
    return new Date(base + timeLimitMinutes * 60_000).toLocaleString("th-TH")
  }, [exam?.startedAt, timeLimitMinutes])

useEffect(() => {
  if (typeof window === "undefined") return
  const updateWidth = () => setViewportWidth(window.innerWidth)
  updateWidth()
  window.addEventListener("resize", updateWidth)
  return () => window.removeEventListener("resize", updateWidth)
}, [])

  useEffect(() => {
    if (!timeLimitMinutes || timeLimitMinutes <= 0) {
      setRemainingSeconds(null)
      return
    }
    const startMs = exam?.startedAt ? new Date(exam.startedAt).getTime() : Date.now()
    const deadline = startMs + timeLimitMinutes * 60_000

    const tick = () => {
      const diff = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setRemainingSeconds(diff)
      return diff
    }

    let current = tick()
    if (current === 0) return

    const timer = window.setInterval(() => {
      current = tick()
      if (current === 0) window.clearInterval(timer)
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [exam?.startedAt, timeLimitMinutes])

  const formatCountdown = (seconds: number | null) => {
    if (seconds == null) return "-"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

const summaryContent = exam ? (
  <div className="mt-3 space-y-3 text-sm text-gray-700">
      {exam.courseTitle && (
        <div>
          คอร์ส: <span className="font-medium text-gray-900">{exam.courseTitle}</span>
        </div>
      )}
      <div>
        จำนวนข้อ: <span className="font-medium text-gray-900">{totalQuestions}</span>
      </div>
      {typeof exam.totalMarks === "number" && (
        <div>
          คะแนนรวม: <span className="font-medium text-gray-900">{exam.totalMarks}</span>
        </div>
      )}
      {typeof exam.passingMarks === "number" && (
        <div>
          ผ่านเมื่อได้: <span className="font-medium text-gray-900">{exam.passingMarks}</span>
        </div>
      )}
      {timeLimitMinutes != null && timeLimitMinutes > 0 && (
        <div>
          เวลาที่กำหนด: <span className="font-medium text-gray-900">{timeLimitMinutes} นาที</span>
        </div>
      )}

      <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-800">
        <div className="flex items-center justify-between font-semibold text-gray-900">
          <span>เวลาคงเหลือ</span>
          <span className={remainingSeconds !== null && remainingSeconds <= 60 ? "text-red-600" : ""}>
            {formatCountdown(remainingSeconds)}
          </span>
        </div>
        {finishAtDisplay && (
          <div className="mt-1 text-xs text-gray-500">สิ้นสุด: {finishAtDisplay}</div>
        )}
        {startedAtDisplay && (
          <div className="text-xs text-gray-500">เริ่มทำเมื่อ: {startedAtDisplay}</div>
        )}
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <span>ความคืบหน้า</span>
          <span>
            {answeredCount}/{totalQuestions}
          </span>
        </div>
        <Progress value={completionPercent} className="h-2" />
        <div className="text-right text-xs text-gray-500">{completionPercent}%</div>
      </div>
    </div>
  ) : null
  const isDesktop = (viewportWidth ?? 0) >= 1440

  useEffect(() => {
    if (isDesktop) {
      setSummaryOpen(true)
    }
  }, [isDesktop])

  const title = exam?.title || "ข้อสอบ"
  const typeBadge = (t?: string) => {
    const x = (t || "").toUpperCase()
    if (x === "PRETEST") return <Badge className="bg-blue-600 text-white">แบบทดสอบก่อนเรียน</Badge>
    if (x === "POSTTEST") return <Badge className="bg-green-600 text-white">แบบทดสอบหลังเรียน</Badge>
    if (x === "PRACTICE") return <Badge className="bg-purple-500 text-white">แบบฝึกหัด</Badge>
    if (x === "MIDTERM") return <Badge className="bg-sky-600 text-white">สอบกลางภาค</Badge>
    if (x === "FINAL") return <Badge className="bg-red-500 text-white">สอบปลายภาค</Badge>
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

  const submit = useCallback(async () => {
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
  }, [answers, courseId, examId, qList, router, user?.id])

  useEffect(() => {
    autoSubmitTriggered.current = false
  }, [exam?.id])

  useEffect(() => {
    if (remainingSeconds !== 0) return
    if (submitting || autoSubmitTriggered.current) return
    autoSubmitTriggered.current = true
    toast({
      title: "หมดเวลาทำข้อสอบ",
      description: "ระบบได้ส่งคำตอบของคุณโดยอัตโนมัติ",
      duration: 6000,
    })
    void submit()
  }, [remainingSeconds, submitting, submit, toast])

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-lg p-6 text-gray-700">โปรดเข้าสู่ระบบ</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">ทำข้อสอบ</h1>
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
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl font-bold">{title}</span>
              <div className="flex items-center gap-2">
                {statusBadge(exam.status)}
                {typeBadge(exam.examType)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {exam.description && (
              <div className="rounded-lg bg-yellow-50/60 px-4 py-3 text-sm text-gray-700">
                {exam.description}
              </div>
            )}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <section className="flex-1 space-y-5">
                {qList.length === 0 && (
                  <div className="text-sm text-gray-500">ข้อสอบนี้ยังไม่มีคำถาม</div>
                )}

                {qList.map((q, idx) => {
                  const qType = (q.type || (Array.isArray(q.options) && q.options.length === 2 ? "TRUE_FALSE" : "MULTIPLE_CHOICE")).toUpperCase()
                  return (
                    <div key={q.id} className="rounded-xl bg-white p-4 shadow-sm space-y-4 transition-shadow duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          {q.image && (
                            <div className="aspect-[16/9] max-w-[830px]  relative w-full overflow-hidden rounded-md border bg-gray-50">
                              <Image
                                src={q.image}
                                alt={q.text || `Question ${idx + 1}`}
                                width={960}
                                height={540}
                                className="h-auto w-full object-contain bg-white"
                                unoptimized
                              />
                            </div>
                          )}
                          <p className="font-medium text-gray-900">
                            {idx + 1}. {q.text || "คำถาม"}
                          </p>
                        </div>

                      </div>
                      {typeof q.marks === "number" && (
                          <Badge className="bg-yellow-100 text-yellow-700 px-2 py-1 text-[11px] font-medium ">
                            {q.marks} คะแนน
                          </Badge>
                        )}

                      {qType === "SHORT_ANSWER" ? (
                        <Input
                          placeholder="พิมพ์คำตอบของคุณ"
                          value={answers[q.id]?.textAnswer || ""}
                          onChange={(e) => setText(q.id, e.target.value)}
                        />
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-1">
                          {(q.options || [
                            { id: "TRUE", text: "ถูก" },
                            { id: "FALSE", text: "ผิด" },
                          ]).map((opt) => {
                            const selected = answers[q.id]?.optionId === opt.id
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition focus-within:ring-2 focus-within:ring-yellow-400 ${selected ? "border-yellow-400 bg-yellow-50 ring-1 ring-yellow-200" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  className="h-4 w-4"
                                  checked={selected}
                                  onChange={() => setChoice(q.id, opt.id)}
                                />
                                <span className="text-sm text-gray-800">{opt.text || opt.id}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => router.push(`/profile/my-courses/course/${encodeURIComponent(String(courseId))}/exams`)}>
                    ยกเลิก
                  </Button>
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={submit} disabled={submitting}>
                    {submitting ? "กำลังส่งคำตอบ..." : "ส่งคำตอบ"}
                  </Button>
                </div>
              </section>

              {isDesktop && (
                <aside className="w-72 shrink-0 space-y-4 sticky top-4">
                  <div className="rounded-xl border bg-gradient-to-br from-white via-white to-yellow-50 p-4 shadow-sm ring-1 ring-black/5">
                    <h3 className="text-sm font-semibold text-gray-900">สรุปข้อสอบ</h3>
                    {summaryContent}
                  </div>

                  {typeof exam.canRetake === "boolean" && (
                    <div className="rounded-xl border bg-white/80 p-4 text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">เงื่อนไข:</span>
                      <span className="ml-2">{exam.canRetake ? "สามารถกลับมาทำข้อสอบได้อีก" : "ทำได้เพียงครั้งเดียว"}</span>
                    </div>
                  )}
                </aside>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating toggle controls for non-desktop */}
      {!isDesktop && !loading && !error && exam && (
        <>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-yellow-400 text-white shadow-lg transition hover:bg-yellow-500 xl:hidden"
            onClick={() => setSummaryOpen((prev) => !prev)}
            aria-label={summaryOpen ? "ซ่อนสรุปข้อสอบ" : "แสดงสรุปข้อสอบ"}
          >
            {summaryOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </Button>

          <Button
            variant="default"
            size="icon"
            className="fixed top-1/2 right-5 z-40 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-yellow-100 bg-white text-yellow-600 shadow-lg transition hover:bg-yellow-50 xl:flex"
            onClick={() => setSummaryOpen((prev) => !prev)}
            aria-label={summaryOpen ? "ซ่อนสรุปข้อสอบ" : "แสดงสรุปข้อสอบ"}
          >
            {summaryOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </Button>
        </>
      )}

      {summaryContent && !isDesktop && !loading && !error && exam && (
        <div>
          <div
            className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${summaryOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setSummaryOpen(false)}
          />
          <div
            className={`fixed top-16 lg:top-20 bottom-0 right-0 z-40 w-full max-w-[90vw] sm:max-w-sm border border-yellow-100 bg-white p-5 shadow-xl transition-transform duration-300 ${summaryOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">สรุปข้อสอบ</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSummaryOpen(false)} aria-label="ปิดสรุป">
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto pr-1 max-h-[calc(100vh-9rem)] lg:max-h-[calc(100vh-10rem)]">
              {summaryContent}
              {typeof exam.canRetake === "boolean" && (
                <div className="mt-4 rounded-xl border bg-white/80 p-4 text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">เงื่อนไข:</span>
                  <span className="ml-2">{exam.canRetake ? "สามารถกลับมาทำข้อสอบได้อีก" : "ทำได้เพียงครั้งเดียว"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
