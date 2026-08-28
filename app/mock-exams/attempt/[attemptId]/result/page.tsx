"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Trophy, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import http from "@/lib/http"

type QuestionResult = {
  id: string
  order: number
  marks: number
  questionText: string
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
  options: { id: string; optionText: string; isCorrect: boolean }[]
  explanation?: string | null
  topic?: { id: string; name: string } | null
  answer: { optionId?: string | null; textAnswer?: string | null; isCorrect: boolean | null; marks: number } | null
}

type TopicBreakdown = { topicId: string; topicName: string; correct: number; total: number; percent: number; isWeak: boolean }

type ResultData = {
  attemptId: string
  mode: "PRACTICE" | "REAL"
  exam: { id: string; title: string; passingMarks: number }
  totalMarks: number
  obtainedMarks: number
  percentage: number
  passed: boolean
  questions: QuestionResult[]
  topicBreakdown: TopicBreakdown[]
}

export default function MockExamResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const router = useRouter()
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    http
      .get(`/api/mock-attempts/${attemptId}/result`)
      .then((res) => {
        if (active && res.data?.success) setData(res.data.data)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [attemptId])

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">กำลังโหลดผลสอบ...</div>
  if (!data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">ไม่พบผลสอบ</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card className="mb-6">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <Trophy className={`h-12 w-12 ${data.passed ? "text-amber-500" : "text-muted-foreground"}`} />
          <h1 className="text-xl font-bold text-foreground">{data.exam.title}</h1>
          <Badge className={data.passed ? "bg-green-600" : "bg-red-500"}>{data.passed ? "ผ่านเกณฑ์" : "ไม่ผ่านเกณฑ์"}</Badge>
          <div className="text-3xl font-bold text-primary">
            {data.obtainedMarks}/{data.totalMarks}
          </div>
          <p className="text-muted-foreground">{data.percentage.toFixed(1)}% (เกณฑ์ผ่าน {data.exam.passingMarks} คะแนน)</p>
        </CardContent>
      </Card>

      {data.topicBreakdown.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h2 className="mb-3 font-semibold text-foreground">สรุปตามหัวข้อ</h2>
            <div className="space-y-3">
              {data.topicBreakdown.map((t) => (
                <div key={t.topicId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      {t.isWeak && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      {t.topicName}
                    </span>
                    <span className="text-muted-foreground">
                      {t.correct}/{t.total} ({t.percent.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={t.percent} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {data.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">ข้อที่ {idx + 1}</span>
                <Badge variant="outline" className={q.answer?.isCorrect ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}>
                  {q.answer?.marks ?? 0}/{q.marks} คะแนน
                </Badge>
              </div>
              <p className="mb-3 text-foreground">{q.questionText}</p>

              {q.questionType === "SHORT_ANSWER" ? (
                <div className="space-y-1 text-sm">
                  <p>
                    คำตอบของคุณ: <span className="font-medium">{q.answer?.textAnswer || "-"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    เฉลย: <span className="font-medium text-foreground">{q.options[0]?.optionText}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = q.answer?.optionId === opt.id
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 rounded-md border p-2.5 text-sm ${
                          opt.isCorrect ? "border-green-300 bg-green-50" : isSelected ? "border-red-300 bg-red-50" : ""
                        }`}
                      >
                        {opt.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        ) : isSelected ? (
                          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                        ) : (
                          <span className="h-4 w-4 shrink-0" />
                        )}
                        {opt.optionText}
                      </div>
                    )
                  })}
                </div>
              )}

              {q.explanation && <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">{q.explanation}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={() => router.push(`/mock-exams/${data.exam.id}`)}>
          กลับไปหน้าข้อสอบ
        </Button>
        <Button onClick={() => router.push("/mock-exams")}>ข้อสอบจำลองอื่นๆ</Button>
      </div>
    </div>
  )
}
