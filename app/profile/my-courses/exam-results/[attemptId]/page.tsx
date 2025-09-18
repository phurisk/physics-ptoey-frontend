"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type AttemptResult = {
  id: string
  examId?: string | null
  examTitle?: string | null
  examDescription?: string | null
  courseId?: string | null
  courseTitle?: string | null
  score?: number | null
  total?: number | null
  status?: string | null
  percentage?: number | null
  passed?: boolean | null
  startedAt?: string | null
  completedAt?: string | null
  attemptedAt?: string | null
  totalQuestions?: number | null
  correctAnswers?: number | null
  questions?: Array<{
    id: string
    text?: string | null
    image?: string | null
    type?: string | null
    marks?: number | null
    explanation?: string | null
    correctOptionId?: string | null
    correctTextAnswer?: string | null
    userOptionId?: string | null
    userTextAnswer?: string | null
    isCorrect?: boolean | null
    obtainedMarks?: number | null
    options?: { id: string; text?: string; isCorrect?: boolean | null }[]
  }>
}

type RawQuestionOption = {
  id?: string
  optionText?: string
  text?: string
  label?: string
  isCorrect?: boolean | null
}

type ResultResponse = {
  success: boolean
  result?: AttemptResult
  data?: AttemptResult
  error?: string
}

export default function ExamResultDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!attemptId || !user?.id) { setLoading(false); return }
      try {
        setLoading(true)
        const res = await fetch(`/api/my-courses/exam-results/${encodeURIComponent(String(attemptId))}?userId=${encodeURIComponent(String(user.id))}`, { cache: "no-store" })
        const json: ResultResponse = await res.json().catch(() => ({ success: false }))
        if (!res.ok || json.success === false) throw new Error(json?.error || `HTTP ${res.status}`)
        const data: any = json.result || json.data || null
        if (active && data) {
          const exam = data.exam ?? {}
          const course = exam.course ?? {}
          const normalized: AttemptResult = {
            id: String(data.id ?? ""),
            examId: exam?.id ?? null,
            examTitle: exam?.title ?? null,
            examDescription: exam?.description ?? null,
            courseId: course?.id ?? null,
            courseTitle: course?.title ?? null,
            score: typeof data.obtainedMarks === "number" ? data.obtainedMarks : null,
            total: typeof data.totalMarks === "number" ? data.totalMarks : null,
            status: data.status ?? null,
            percentage: typeof data.percentage === "number" ? data.percentage : null,
            passed: typeof data.passed === "boolean" ? data.passed : null,
            startedAt: data.startedAt ?? null,
            completedAt: data.completedAt ?? null,
            attemptedAt: data.completedAt ?? data.startedAt ?? null,
            totalQuestions: typeof data.totalQuestions === "number" ? data.totalQuestions : null,
            correctAnswers: typeof data.correctAnswers === "number" ? data.correctAnswers : null,
            questions: Array.isArray(data.answers)
              ? data.answers.map((answer: any) => {
                  const question = answer.question ?? {}
                  const rawOptions: RawQuestionOption[] = Array.isArray(question.options)
                    ? (question.options as RawQuestionOption[])
                    : []
                  const options = rawOptions.map((opt) => ({
                        id: String(opt.id ?? ""),
                        text:
                          typeof opt.optionText === "string"
                            ? opt.optionText
                            : typeof opt.text === "string"
                              ? opt.text
                              : typeof opt.label === "string"
                                ? opt.label
                                : String(opt.id ?? ""),
                        isCorrect: typeof opt.isCorrect === "boolean" ? opt.isCorrect : null,
                      }))
                  const correctOption = options.find((opt) => opt.isCorrect)
                  const studentAnswer = answer.studentAnswer ?? {}

                  return {
                    id: String(answer.questionId ?? question.id ?? ""),
                    text: question.questionText ?? answer.questionText ?? null,
                    image: question.questionImage ?? answer.questionImage ?? null,
                    type: question.questionType ?? answer.questionType ?? null,
                    marks: typeof question.marks === "number" ? question.marks : typeof answer.marks === "number" ? answer.marks : null,
                    explanation: question.explanation ?? answer.explanation ?? null,
                    correctOptionId: correctOption?.id ?? null,
                    correctTextAnswer: null,
                    userOptionId: studentAnswer.optionId ?? null,
                    userTextAnswer: studentAnswer.textAnswer ?? null,
                    isCorrect: typeof studentAnswer.isCorrect === "boolean" ? studentAnswer.isCorrect : null,
                    obtainedMarks: typeof studentAnswer.obtainedMarks === "number" ? studentAnswer.obtainedMarks : null,
                    options,
                  }
                })
              : [],
          }
          setResult(normalized)
        } else if (active) {
          setResult(null)
        }
      } catch (e: any) {
        if (active) setError(e?.message || "โหลดผลลัพธ์ไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [attemptId, user?.id])

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
        <h1 className="text-2xl font-bold">ผลการทำข้อสอบ</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/profile/my-courses/exam-results")}>ประวัติทั้งหมด</Button>
          <Button variant="outline" onClick={() => router.back()}>ย้อนกลับ</Button>
        </div>
      </div>

      {loading && (
        <>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40" />
          <Skeleton className="h-72" />
        </>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{result.examTitle || "ข้อสอบ"}</span>
                <div className="flex items-center gap-2">
                  {result.status && <Badge variant="secondary">{result.status}</Badge>}
                  {typeof result.passed === "boolean" && (
                    <Badge className={result.passed ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-rose-100 text-rose-700 border border-rose-200"}>
                      {result.passed ? "ผ่าน" : "ไม่ผ่าน"}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-700">คอร์ส: {result.courseTitle || result.courseId}</div>
              {result.examDescription && (
                <div className="text-xs text-gray-500">{result.examDescription}</div>
              )}
              <div className="text-sm text-gray-700">
                คะแนน: {result.score ?? 0}{result.total != null ? `/${result.total}` : ""}
                {typeof result.percentage === "number" && !Number.isNaN(result.percentage) && (
                  <span className="ml-2 text-xs text-gray-500">({Math.round(result.percentage)}%)</span>
                )}
              </div>
              {result.totalQuestions != null && result.correctAnswers != null && (
                <div className="text-sm text-gray-600">ถูก {result.correctAnswers}/{result.totalQuestions} ข้อ</div>
              )}
              <div className="text-xs text-gray-500">
                {result.attemptedAt ? new Date(result.attemptedAt).toLocaleString("th-TH") : null}
                {result.startedAt && result.completedAt && (
                  <span className="ml-2 text-[11px] text-gray-400">ใช้เวลา {Math.max(0, Math.round((new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / 60000))} นาที</span>
                )}
              </div>
            </CardContent>
          </Card>

          {Array.isArray(result.questions) && result.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดข้อคำถาม</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.questions.map((q, idx) => {
                  const options = q.options || []
                  const userOption = options.find((o) => o.id === q.userOptionId)
                  const correctOption = options.find((o) => o.id === q.correctOptionId || o.isCorrect)
                  const userAnswerText = q.userTextAnswer || userOption?.text || q.userOptionId || "-"
                  const correctAnswerText = q.correctTextAnswer || correctOption?.text || q.correctOptionId || "-"
                  const isCorrect = q.isCorrect ?? (q.correctOptionId && q.correctOptionId === q.userOptionId)
                  const obtainedMarks = q.obtainedMarks ?? (isCorrect ? q.marks ?? 0 : 0)

                  return (
                    <div key={q.id} className="p-4 border rounded-lg bg-white space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-medium text-gray-900">
                          {idx + 1}. {q.text || "คำถาม"}
                        </div>
                        <Badge className={isCorrect ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-rose-100 text-rose-700 border border-rose-200"}>
                          {isCorrect ? "ถูกต้อง" : "ไม่ถูก"}
                        </Badge>
                      </div>
                      {q.image && (
                        <div className="overflow-hidden rounded-md border">
                          <Image
                            src={q.image}
                            alt={q.text || `Question ${idx + 1}`}
                            width={800}
                            height={450}
                            className="h-auto w-full object-contain bg-white"
                          />
                        </div>
                      )}
                      <div className="text-xs text-gray-500">คะแนนที่ได้: {obtainedMarks}/{q.marks ?? "-"}</div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>คำตอบของคุณ: <span className="font-medium">{userAnswerText}</span></div>
                        <div>เฉลย: <span className="font-medium">{correctAnswerText}</span></div>
                        {q.explanation && (
                          <div className="text-xs text-gray-500">อธิบาย: {q.explanation}</div>
                        )}
                      </div>
                      {options.length > 0 && (
                        <div className="pt-2 text-xs text-gray-500 space-y-1">
                          <div className="font-semibold text-gray-600">ตัวเลือกทั้งหมด:</div>
                          <ul className="space-y-1">
                            {options.map((opt) => (
                              <li key={opt.id} className={`${opt.id === q.userOptionId ? "text-gray-900" : "text-gray-600"}`}>
                                <span className="font-medium">{opt.id === q.correctOptionId || opt.isCorrect ? "✓" : "•"}</span>{" "}
                                {opt.text || opt.id}
                                {opt.id === q.userOptionId && " (เลือก)"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
