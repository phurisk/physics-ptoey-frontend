"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { http } from "@/lib/http"

type TopicProgressPoint = { attemptId: string; examTitle: string; date: string | null; correct: number; total: number; percent: number }
type TopicProgress = { topicId: string; topicName: string; points: TopicProgressPoint[]; firstPercent: number; latestPercent: number; delta: number }

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
        <TrendingUp className="h-4 w-4" />+{delta}%
      </span>
    )
  if (delta < 0)
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-red-600">
        <TrendingDown className="h-4 w-4" />
        {delta}%
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
      <Minus className="h-4 w-4" />
      ไม่เปลี่ยนแปลง
    </span>
  )
}

function TopicSparkline({ topic }: { topic: TopicProgress }) {
  return (
    <div className="flex h-16 items-end gap-1">
      {topic.points.map((p) => (
        <div key={p.attemptId} className="flex h-12 w-full flex-1 items-end" title={`${p.examTitle} — ${p.percent}% (${p.correct}/${p.total})`}>
          <div className={`w-full rounded-t-sm ${p.percent >= 60 ? "bg-emerald-400" : "bg-red-400"}`} style={{ height: `${Math.max(4, p.percent)}%` }} />
        </div>
      ))}
    </div>
  )
}

export default function MockTopicProgressPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [topics, setTopics] = useState<TopicProgress[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    http
      .get("/api/mock-topics/progress")
      .then((res) => {
        if (res.data?.success) setTopics(res.data.data)
        else setError(res.data?.error || "โหลดพัฒนาการไม่สำเร็จ")
      })
      .catch((e) => setError(e?.response?.data?.error || e?.message || "โหลดพัฒนาการไม่สำเร็จ"))
  }, [authLoading, isAuthenticated])

  if (!authLoading && !isAuthenticated) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">โปรดเข้าสู่ระบบ</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link href="/mock-exams">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับไปรายการข้อสอบจำลอง
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">พัฒนาการของฉัน</h1>
        <p className="mt-1 text-muted-foreground">ติดตามว่าจุดที่คุณเคยอ่อน ดีขึ้นจริงหรือไม่ เทียบข้ามทุกข้อสอบจำลองที่เคยทำ (โหมดสอบจริง)</p>
      </div>

      {(authLoading || topics === null) && !error && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          กำลังโหลด...
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {topics && topics.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            ยังไม่มีข้อมูลพัฒนาการ — ต้องทำข้อสอบจำลองโหมด &quot;สอบจริง&quot; ที่มีการระบุหัวข้อของคำถามอย่างน้อย 1 ชุดก่อน
          </CardContent>
        </Card>
      )}

      {topics &&
        topics.map((topic) => (
          <Card key={topic.topicId}>
            <CardContent className="space-y-3 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">{topic.topicName}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">ล่าสุด {topic.latestPercent}%</span>
                  {topic.points.length > 1 && <DeltaBadge delta={topic.delta} />}
                </div>
              </div>
              {topic.points.length > 1 ? (
                <TopicSparkline topic={topic} />
              ) : (
                <p className="text-xs text-muted-foreground">ทำมาแล้ว 1 ครั้ง — ทำอีกชุดที่มีหัวข้อนี้เพื่อดูแนวโน้ม</p>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
