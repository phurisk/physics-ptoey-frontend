"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  LineChart,
  Trophy,
  Zap,
  Gauge,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ZoomIn,
  Clock,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { http } from "@/lib/http"

type QuestionReview = {
  id: string
  order: number
  questionText: string
  questionImage: string | null
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"
  marks: number
  topic: { id: string; name: string } | null
  explanation: string | null
  explanationImages: string[]
  options: { id: string; optionText: string; isCorrect: boolean }[]
  studentAnswer: { optionId: string | null; textAnswer: string | null; isCorrect: boolean | null; marksAwarded: number } | null
  timing: { mySec: number; avgSec: number } | null
  mistakeSharePercent: number | null
}
type TopicBreakdown = { topicId: string; topicName: string; correct: number; total: number; percent: number; isWeak: boolean }
type Comparison =
  | { available: false; totalAttempts: number }
  | {
      available: true
      totalAttempts: number
      myDurationSec: number
      avgDurationSec: number
      scorePercentile: number | null
      timePercentile: number | null
      efficiencyPercentile: number | null
    }
type RecommendedCourse = {
  id: string
  title: string
  description: string | null
  price: number
  discountPrice: number | null
  isFree: boolean
  coverImageUrl: string | null
}
type ResultView = {
  attempt: { id: string; mode: "PRACTICE" | "REAL"; totalMarks: number; obtainedMarks: number; percentage: number; passed: boolean }
  mockExam: { id: string; title: string }
  questions: QuestionReview[]
  topicBreakdown: TopicBreakdown[]
  comparison: Comparison
  recommendedCourses: RecommendedCourse[]
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m} นาที ${s} วินาที` : `${s} วินาที`
}

function PercentileRow({ icon, label, percentile, detail }: { icon: React.ReactNode; label: string; percentile: number | null; detail: string }) {
  if (percentile == null) return null
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {icon}
          {label}
        </span>
        <span className="text-muted-foreground">{detail}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, percentile)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">ดีกว่า {percentile}% ของคนที่ทำข้อสอบชุดนี้</p>
    </div>
  )
}

function ComparisonCard({ comparison }: { comparison: Comparison }) {
  if (!comparison.available) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          ยังมีคนทำข้อสอบชุดนี้ไม่มากพอ ({comparison.totalAttempts} คน) — ต้องมีอย่างน้อย 3 คนถึงจะเทียบเปอร์เซ็นไทล์ได้
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">เทียบกับคนอื่น</h3>
          <span className="text-xs text-muted-foreground">จากทั้งหมด {comparison.totalAttempts} คนที่ทำข้อสอบชุดนี้</span>
        </div>
        <PercentileRow icon={<Trophy className="h-4 w-4 text-amber-500" />} label="คะแนน" percentile={comparison.scorePercentile} detail="" />
        <PercentileRow
          icon={<Zap className="h-4 w-4 text-blue-500" />}
          label="ความเร็ว"
          percentile={comparison.timePercentile}
          detail={`คุณใช้เวลา ${formatDuration(comparison.myDurationSec)} (เฉลี่ย ${formatDuration(comparison.avgDurationSec)})`}
        />
        <PercentileRow
          icon={<Gauge className="h-4 w-4 text-emerald-500" />}
          label="ความคุ้มเวลา (คะแนน/เวลา)"
          percentile={comparison.efficiencyPercentile}
          detail=""
        />
      </CardContent>
    </Card>
  )
}

function TopicRadarCard({ topicBreakdown }: { topicBreakdown: TopicBreakdown[] }) {
  if (topicBreakdown.length === 0) return null
  const chartData = topicBreakdown.map((t) => ({ topic: t.topicName, percent: t.percent }))

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-1 font-semibold text-foreground">วิเคราะห์จุดที่ควรพัฒนา</h3>
        <p className="mb-4 text-sm text-muted-foreground">สรุปคะแนนแยกตามเรื่องที่ข้อสอบวัด (%) ยิ่งใกล้ศูนย์กลางยิ่งควรทบทวนเพิ่ม</p>
        <div className="mx-auto h-[320px] w-full max-w-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fontSize: 10 }} />
              <Radar dataKey="percent" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
              <RechartsTooltip formatter={(value: number) => `${value}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-1.5">
          {topicBreakdown.map((t) => (
            <div key={t.topicId} className="flex items-center justify-between text-sm">
              <span className={t.isWeak ? "font-semibold text-red-600" : "text-foreground"}>{t.topicName}</span>
              <span className="text-muted-foreground">
                {t.correct}/{t.total} ({t.percent.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
        {topicBreakdown.some((t) => t.isWeak) && (
          <div className="mt-4 space-y-1 border-t pt-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">คำแนะนำ</p>
            <ul className="list-inside list-disc space-y-1">
              {topicBreakdown
                .filter((t) => t.isWeak)
                .map((t) => (
                  <li key={t.topicId}>
                    ควรทบทวนเรื่อง <span className="font-semibold text-foreground">{t.topicName}</span> เพิ่มเติม (ทำถูก {t.correct} จาก {t.total} ข้อ)
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const QUARTILE_LABELS = ["ช่วงที่ 1 (เริ่มต้น)", "ช่วงที่ 2", "ช่วงที่ 3", "ช่วงที่ 4 (ท้ายๆ)"]

function TimeAllocationCard({ questions }: { questions: QuestionReview[] }) {
  const hasTiming = questions.filter((q) => q.timing).length >= 4
  if (!hasTiming || questions.length < 4) return null

  const size = Math.ceil(questions.length / 4)
  const quartiles = QUARTILE_LABELS.map((label, i) => {
    const slice = questions.slice(i * size, (i + 1) * size)
    const totalTimeSec = slice.reduce((sum, q) => sum + (q.timing?.mySec ?? 0), 0)
    const answered = slice.filter((q) => q.studentAnswer?.isCorrect != null)
    const correct = answered.filter((q) => q.studentAnswer?.isCorrect).length
    const accuracy = answered.length > 0 ? Math.round((correct / answered.length) * 100) : null
    return { label, totalTimeSec, accuracy, count: slice.length }
  }).filter((q) => q.count > 0)

  const maxTime = Math.max(...quartiles.map((q) => q.totalTimeSec), 1)
  const totalTime = quartiles.reduce((s, q) => s + q.totalTimeSec, 0)

  const insights: string[] = []
  const first = quartiles[0]
  const last = quartiles[quartiles.length - 1]
  if (first.accuracy != null && last.accuracy != null && first.accuracy - last.accuracy >= 20) {
    insights.push(`ความแม่นยำตกลงจากช่วงแรก (${first.accuracy}%) เหลือช่วงท้าย (${last.accuracy}%) — อาจรีบตอบเกินไปหรือเหนื่อยล้าตอนท้าย`)
  }
  if (totalTime > 0 && first.totalTimeSec / totalTime > 0.4) {
    insights.push(`ใช้เวลากับ${QUARTILE_LABELS[0]}ไปแล้ว ${Math.round((first.totalTimeSec / totalTime) * 100)}% ของเวลาทั้งหมด — อาจเหลือเวลาไม่พอสำหรับข้อหลังๆ`)
  }
  const slowestIdx = quartiles.reduce((maxIdx, q, i, arr) => (q.totalTimeSec > arr[maxIdx].totalTimeSec ? i : maxIdx), 0)
  if (quartiles[slowestIdx].accuracy != null && quartiles[slowestIdx].accuracy! < 50) {
    insights.push(`${QUARTILE_LABELS[slowestIdx]}ใช้เวลานานที่สุด แต่ความแม่นยำยังต่ำ (${quartiles[slowestIdx].accuracy}%) — ลองฝึกโจทย์แนวนี้เพิ่ม`)
  }

  const formatMin = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return m > 0 ? `${m}น ${s}วิ` : `${s}วิ`
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">การจัดสรรเวลา</h3>
        </div>
        <p className="text-sm text-muted-foreground">แบ่งข้อสอบเป็น 4 ช่วงตามลำดับข้อ ดูว่าใช้เวลาและทำได้แม่นยำแค่ไหนในแต่ละช่วง</p>

        <div className="grid grid-cols-4 gap-3">
          {quartiles.map((q) => (
            <div key={q.label} className="space-y-2 text-center">
              <div className="flex h-24 items-end justify-center rounded-md bg-muted/50 p-1">
                <div
                  className={`w-full rounded-sm ${q.accuracy == null ? "bg-muted-foreground/30" : q.accuracy >= 60 ? "bg-emerald-400" : "bg-red-400"}`}
                  style={{ height: `${Math.max(6, (q.totalTimeSec / maxTime) * 100)}%` }}
                  title={formatMin(q.totalTimeSec)}
                />
              </div>
              <p className="text-xs font-medium leading-tight text-foreground">{q.label}</p>
              <p className="text-xs text-muted-foreground">{formatMin(q.totalTimeSec)}</p>
              <p className={`text-xs font-medium ${q.accuracy != null && q.accuracy < 60 ? "text-red-600" : "text-emerald-600"}`}>
                {q.accuracy != null ? `${q.accuracy}%` : "-"}
              </p>
            </div>
          ))}
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5 border-t pt-3">
            {insights.map((text, i) => (
              <p key={i} className="flex items-start gap-1.5 text-sm text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {text}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuestionReviewCard({ question, index, onPreviewImage }: { question: QuestionReview; index: number; onPreviewImage: (url: string) => void }) {
  const sa = question.studentAnswer
  const cardTone = sa?.isCorrect === true ? "border-emerald-200 bg-emerald-50/40" : sa?.isCorrect === false ? "border-red-200 bg-red-50/40" : ""

  return (
    <Card className={cardTone}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-foreground">
            {index + 1}. {question.questionText}
          </p>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm text-muted-foreground">
              {sa?.marksAwarded ?? 0}/{question.marks} คะแนน
            </span>
            {question.timing && (
              <span
                className={`flex items-center gap-1 text-xs ${question.timing.mySec > question.timing.avgSec * 1.5 ? "text-amber-600" : "text-muted-foreground"}`}
                title="เวลาที่ใช้ตอบข้อนี้ เทียบกับค่าเฉลี่ยของคนอื่น"
              >
                <Clock className="h-3 w-3" />
                {Math.round(question.timing.mySec)}s (เฉลี่ย {Math.round(question.timing.avgSec)}s)
              </span>
            )}
          </div>
        </div>

        {question.questionImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <button type="button" onClick={() => onPreviewImage(question.questionImage!)} className="group relative block">
            <img src={question.questionImage} alt="" className="max-w-full rounded-md border" />
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-white" />
            </span>
          </button>
        )}

        {question.questionType === "SHORT_ANSWER" ? (
          <div className="space-y-1 text-sm">
            <p>
              คำตอบของคุณ: <span className="font-medium">{sa?.textAnswer || "(ไม่ได้ตอบ)"}</span>
            </p>
            <p className="text-muted-foreground">เฉลย: {question.options.find((o) => o.isCorrect)?.optionText}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {question.options.map((opt) => {
              const picked = sa?.optionId === opt.id
              return (
                <div key={opt.id} className="flex items-center gap-2 text-sm">
                  {opt.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : picked ? (
                    <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                  ) : (
                    <span className="h-4 w-4 shrink-0" />
                  )}
                  <span className={picked ? "font-medium" : ""}>{opt.optionText}</span>
                </div>
              )
            })}
          </div>
        )}

        {(question.explanation || question.explanationImages.length > 0) && (
          <div className="space-y-2 rounded-md border border-dashed bg-muted/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground">คำอธิบายเฉลย</p>
            {question.explanation && <p className="text-sm text-foreground">{question.explanation}</p>}
            {question.explanationImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.explanationImages.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <button key={url + i} type="button" onClick={() => onPreviewImage(url)} className="group relative">
                    <img src={url} alt="" className="h-24 w-32 rounded-md border object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                      <ZoomIn className="h-5 w-5 text-white" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {question.mistakeSharePercent != null && (
          <p className="text-xs text-amber-700">
            มีคนตอบผิดข้อนี้ {question.mistakeSharePercent}% ที่เลือกตัวเลือกเดียวกับคุณ — เป็นจุดที่เข้าใจผิดร่วมกันเยอะ ลองทบทวนเพิ่ม
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function CourseRecommendationsCard({ courses }: { courses: RecommendedCourse[] }) {
  if (courses.length === 0) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">คอร์สเรียนที่แนะนำ</h3>
      </div>
      <p className="text-sm text-muted-foreground">คอร์สที่ตรงกับวิชา/ระดับของข้อสอบชุดนี้ ช่วยปูพื้นฐานจุดที่ยังอ่อนอยู่ได้</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <h4 className="mb-1 line-clamp-2 font-medium text-foreground">{course.title}</h4>
                {course.description && <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>}
                <div className="font-bold text-primary">
                  {course.isFree || course.price === 0 ? (
                    <span className="text-green-600">ฟรี</span>
                  ) : (
                    `฿${(course.discountPrice || course.price).toLocaleString()}`
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function MockExamResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const [result, setResult] = useState<ResultView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    http
      .get(`/api/mock-attempts/${attemptId}/result`)
      .then((res) => {
        if (!active) return
        if (res.data?.success) setResult(res.data.data)
        else setError(res.data?.error || "โหลดผลข้อสอบไม่สำเร็จ")
      })
      .catch((e) => active && setError(e?.response?.data?.error || "โหลดผลข้อสอบไม่สำเร็จ"))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [attemptId])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/mock-exams">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปรายการข้อสอบจำลอง
          </Button>
        </Link>
        <Link href="/mock-exams/progress">
          <Button variant="outline" size="sm">
            <LineChart className="mr-2 h-4 w-4" />
            พัฒนาการของฉัน
          </Button>
        </Link>
      </div>

      {loading && (
        <>
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </>
      )}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && result && (
        <>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-1 text-sm text-muted-foreground">{result.mockExam.title}</p>
              <div className="text-4xl font-bold text-foreground">
                {result.attempt.obtainedMarks}/{result.attempt.totalMarks}
              </div>
              <p className="mt-1 text-muted-foreground">{result.attempt.percentage.toFixed(1)}%</p>
              <Badge className={result.attempt.passed ? "mt-3 bg-emerald-600" : "mt-3 bg-red-500"}>{result.attempt.passed ? "ผ่าน" : "ไม่ผ่าน"}</Badge>
            </CardContent>
          </Card>

          {result.attempt.mode === "REAL" && <ComparisonCard comparison={result.comparison} />}
          <TopicRadarCard topicBreakdown={result.topicBreakdown} />
          <TimeAllocationCard questions={result.questions} />

          <div className="space-y-4">
            {result.questions.map((q, idx) => (
              <QuestionReviewCard key={q.id} question={q} index={idx} onPreviewImage={setPreviewImage} />
            ))}
          </div>

          <CourseRecommendationsCard courses={result.recommendedCourses} />
        </>
      )}

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
