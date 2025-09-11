"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type Attempt = {
  id: string
  examId?: string
  examTitle?: string
  courseId?: string
  courseTitle?: string
  score?: number | null
  total?: number | null
  status?: string
  attemptedAt?: string
}

type ResultsResponse = {
  success: boolean
  attempts?: Attempt[]
  data?: { attempts?: Attempt[]; pagination?: any } | Attempt[]
  pagination?: any
  error?: string
}

export default function ExamResultsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) { setLoading(false); return }
      try {
        setLoading(true)
        const res = await fetch(`/api/my-courses/exam-results?userId=${encodeURIComponent(String(user.id))}`, { cache: "no-store" })
        const json: ResultsResponse = await res.json().catch(() => ({ success: false }))
        if (!res.ok || json.success === false) throw new Error(json?.error || `HTTP ${res.status}`)
        const list = Array.isArray(json.attempts)
          ? json.attempts
          : Array.isArray(json?.data as any)
            ? (json.data as any)
            : Array.isArray((json?.data as any)?.attempts)
              ? (json?.data as any)?.attempts
              : []
        if (active) setAttempts(list)
      } catch (e: any) {
        if (active) setError(e?.message || "โหลดประวัติไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user?.id])

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
        <h1 className="text-2xl font-bold">ประวัติการทำข้อสอบ</h1>
        <Button variant="outline" onClick={() => router.push("/profile/my-courses")}>กลับไปหน้าคอร์สของฉัน</Button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && attempts.length === 0 && (
        <div className="text-gray-600">ยังไม่มีประวัติการทำข้อสอบ</div>
      )}

      <div className="grid gap-4">
        {attempts.map((a) => (
          <Card key={a.id} className="bg-white border-gray-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-semibold">{a.examTitle || "ข้อสอบ"}</div>
                <div className="text-sm text-gray-600">คอร์ส: {a.courseTitle || a.courseId}</div>
                <div className="text-xs text-gray-500">{a.attemptedAt ? new Date(a.attemptedAt).toLocaleString("th-TH") : null}</div>
              </div>
              <div className="flex items-center gap-3">
                {a.status && <Badge variant="secondary">{a.status}</Badge>}
                {a.total != null && (
                  <div className="text-sm font-medium">คะแนน: {a.score ?? 0}/{a.total}</div>
                )}
                <Link href={`/profile/my-courses/exam-results/${encodeURIComponent(String(a.id))}`}>
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">ดูรายละเอียด</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

