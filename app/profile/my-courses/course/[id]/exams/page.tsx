"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"

type ExamItem = {
  id: string
  title?: string
  description?: string | null
  type?: string 
  examType?: string 
  timeLimit?: number | null 
  timeLimitMinutes?: number | null
  duration?: number | null
  questionCount?: number | null
  totalQuestions?: number | null
  attempts?: number | null
  maxAttempts?: number | null
  status?: string | null
  canRetake?: boolean
  lastAttempt?: string | null
  createdAt?: string | null
}

type ExamsResponse = {
  success: boolean
  exams?: ExamItem[]
  data?: { exams?: ExamItem[] } | ExamItem[]
  error?: string
}

export default function CourseExamsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exams, setExams] = useState<ExamItem[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id || !user?.id) { setLoading(false); return }
      try {
        setLoading(true)
        const res = await fetch(`/api/my-courses/course/${encodeURIComponent(String(id))}/exams?userId=${encodeURIComponent(String(user.id))}`, { cache: "no-store" })
        const json: ExamsResponse = await res.json().catch(() => ({ success: false }))
        if (!res.ok || json.success === false) throw new Error(json?.error || `HTTP ${res.status}`)
        const list = Array.isArray(json.exams)
          ? json.exams
          : Array.isArray(json?.data as any)
            ? (json.data as any)
            : Array.isArray((json?.data as any)?.exams)
              ? (json?.data as any)?.exams
              : []
        const normalized = list.map((item: any) => ({
          ...item,
          type: item?.type || item?.examType,
          examType: item?.examType || item?.type,
          questionCount: item?.questionCount ?? item?.totalQuestions ?? null,
          timeLimit: item?.timeLimit ?? item?.timeLimitMinutes ?? null,
          duration: item?.duration ?? null,
          maxAttempts: item?.maxAttempts ?? item?.attempts ?? null,
        }))
        if (active) setExams(normalized)
      } catch (e: any) {
        if (active) setError(e?.message || "โหลดข้อสอบไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id, user?.id])

  const badgeForType = (type?: string) => {
    const t = (type || "").toUpperCase()
    if (t === "PRETEST") return <Badge className="bg-blue-600 text-white">แบบทดสอบก่อนเรียน</Badge>
    if (t === "POSTTEST") return <Badge className="bg-green-600 text-white">แบบทดสอบหลังเรียน</Badge>
    if (t === "PRACTICE") return <Badge className="bg-purple-500 text-white">แบบฝึกหัด</Badge>
    if (t === "MIDTERM") return <Badge className="bg-sky-600 text-white">สอบกลางภาค</Badge>
    if (t === "FINAL") return <Badge className="bg-red-500 text-white">สอบปลายภาค</Badge>
    return <Badge className="bg-amber-500 text-white">แบบทดสอบ</Badge>
  }

  const statusLabel = (status?: string | null) => {
    const value = (status || "").toUpperCase()
    if (value === "PASSED") return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">ผ่านแล้ว</Badge>
    if (value === "FAILED") return <Badge className="bg-rose-100 text-rose-700 border border-rose-200">ไม่ผ่าน</Badge>
    if (value === "IN_PROGRESS") return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">กำลังทำ</Badge>
    if (value === "NOT_STARTED") return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">ยังไม่ได้ทำ</Badge>
    if (value) return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{value}</Badge>
    return null
  }

  const attemptsInfo = (status?: string | null, attempts?: number | null, maxAttempts?: number | null) => {
    const total = typeof maxAttempts === "number" && maxAttempts > 0 ? maxAttempts : null
    const used = typeof attempts === "number" && attempts >= 0 ? attempts : null
    if (total && used !== null) {
      return `${Math.min(used, total)}/${total}`
    }
    if (total) return `0/${total}`
    return null
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
        <h1 className="text-2xl font-bold">ข้อสอบของคอร์ส</h1>
        <Button variant="outline" onClick={() => router.push(`/profile/my-courses/course/${encodeURIComponent(String(id))}`)}>กลับไปหน้าคอร์ส</Button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && exams.length === 0 && (
        <div className="text-gray-600">คอร์สนี้ยังไม่มีข้อสอบ</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {exams.map((ex) => {
          const attemptText = attemptsInfo(ex.status, ex.attempts ?? (ex as any)?.attemptCount ?? null, ex.maxAttempts)
          const disableStart = ex.canRetake === false
          return (
            <Card key={ex.id} className="bg-white border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold truncate">{ex.title || "ข้อสอบ"}</div>
                    {ex.description && (
                      <div className="text-sm text-gray-600 line-clamp-2">{ex.description}</div>
                    )}
                  </div>
                  {badgeForType(ex.examType)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  {statusLabel(ex.status)}
                  {ex.questionCount != null && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {ex.questionCount} ข้อ
                    </span>
                  )}
                  {(ex.timeLimit ?? ex.duration) != null && (ex.timeLimit ?? ex.duration)! > 0 && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      เวลา {(ex.timeLimit ?? ex.duration)} นาที
                    </span>
                  )}
                  {attemptText && (
                    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                      {ex.canRetake === false ? "ทำครบแล้ว" : "ทำซ้ำได้"} ({attemptText})
                    </span>
                  )}
                  {attemptText == null && typeof ex.canRetake === "boolean" && (
                    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                      {ex.canRetake ? "ทำซ้ำได้" : "ทำครบแล้ว"}
                    </span>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link href={`/profile/my-courses/course/${encodeURIComponent(String(id))}/exams/${encodeURIComponent(String(ex.id))}`}>
                    <Button
                      className={`bg-yellow-400 hover:bg-yellow-500 text-white ${disableStart ? "opacity-80" : ""}`}
                      disabled={disableStart}
                    >
                      {disableStart ? "ทำเสร็จแล้ว" : "เริ่มทำข้อสอบ"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
