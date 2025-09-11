"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type AttemptResult = {
  id: string
  examId?: string
  examTitle?: string
  courseId?: string
  courseTitle?: string
  score?: number | null
  total?: number | null
  status?: string
  attemptedAt?: string
  questions?: Array<{
    id: string
    text?: string
    correctOptionId?: string | null
    correctTextAnswer?: string | null
    userOptionId?: string | null
    userTextAnswer?: string | null
    options?: { id: string; text?: string }[]
  }>
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
        const data = json.result || json.data || null
        if (active) setResult(data)
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
                {result.status && <Badge variant="secondary">{result.status}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-700">คอร์ส: {result.courseTitle || result.courseId}</div>
              <div className="text-sm text-gray-700">คะแนน: {(result.score ?? 0)} / {(result.total ?? 0)}</div>
              <div className="text-xs text-gray-500">{result.attemptedAt ? new Date(result.attemptedAt).toLocaleString("th-TH") : null}</div>
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
                  const userText = q.userTextAnswer || (options.find((o) => o.id === q.userOptionId)?.text || q.userOptionId || "")
                  const correctText = q.correctTextAnswer || (options.find((o) => o.id === q.correctOptionId)?.text || q.correctOptionId || "")
                  const isCorrect = (q.correctOptionId && q.correctOptionId === q.userOptionId) || (q.correctTextAnswer && q.correctTextAnswer === q.userTextAnswer)
                  return (
                    <div key={q.id} className="p-4 border rounded-lg bg-white">
                      <div className="font-medium mb-2">{idx + 1}. {q.text || "คำถาม"}</div>
                      <div className="text-sm">
                        <div className="text-gray-700">คำตอบของคุณ: <span className="font-medium">{userText || "-"}</span></div>
                        <div className="text-gray-700">เฉลย: <span className="font-medium">{correctText || "-"}</span></div>
                        <div className={isCorrect ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                          {isCorrect ? "ถูกต้อง" : "ไม่ถูก"}
                        </div>
                      </div>
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

