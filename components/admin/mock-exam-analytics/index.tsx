"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BarChart3, FileText, AlertTriangle, Users, CheckCircle2, TrendingUp } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import { getSubjectLabel } from "@/lib/constants"

type OptionStat = { id: string; optionText: string; isCorrect: boolean; pickedCount: number; pickedPercent: number }
type QuestionStat = {
  id: string
  order: number
  questionText: string
  questionType: string
  marks: number
  topic: { id: string; name: string } | null
  answeredCount: number
  difficultyPercent: number | null
  discrimination: number | null
  isFlagged: boolean
  optionStats: OptionStat[]
  deadDistractorCount: number
}
type AnalyticsData = {
  exam: { id: string; title: string; subject: string; passingMarks: number }
  totalAttempts: number
  passRate: number | null
  avgPercentage: number | null
  distributionBuckets: { label: string; min: number; max: number; count: number }[]
  discriminationAvailable: boolean
  questionStats: QuestionStat[]
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}

function difficultyTone(percent: number | null) {
  if (percent == null) return "border-gray-200 bg-gray-50 text-gray-500"
  if (percent < 20) return "border-red-200 bg-red-50 text-red-700" // too hard
  if (percent > 95) return "border-amber-200 bg-amber-50 text-amber-700" // too easy, low value
  return "border-green-200 bg-green-50 text-green-700"
}

function discriminationTone(value: number | null) {
  if (value == null) return "border-gray-200 bg-gray-50 text-gray-500"
  if (value < 0) return "border-red-200 bg-red-50 text-red-700" // broken/mis-keyed
  if (value < 0.2) return "border-amber-200 bg-amber-50 text-amber-700" // weak
  return "border-green-200 bg-green-50 text-green-700"
}

export default function MockExamAnalyticsManagement() {
  const params = useParams<{ mockExamId: string }>()
  const mockExamId = params.mockExamId as string
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mockExamId) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/mock-exams/${mockExamId}/analytics`)
        const result = await res.json()
        if (result.success) {
          setData(result.data)
        } else {
          toast({ variant: "destructive", title: result.error || "โหลดสถิติไม่สำเร็จ" })
        }
      } catch {
        toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการโหลดสถิติ" })
      } finally {
        setLoading(false)
      }
    })()
  }, [mockExamId, toast])

  const examSubtitle = data ? (
    <div className="flex flex-wrap items-center gap-2">
      <span>ข้อสอบจำลอง: {data.exam.title}</span>
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        {getSubjectLabel(data.exam.subject)}
      </Badge>
      <span className="text-gray-400">•</span>
      <span>{data.totalAttempts} คนทำ (โหมดสอบจริง)</span>
    </div>
  ) : undefined

  const flaggedCount = data?.questionStats?.filter((q) => q.isFlagged).length ?? 0

  return (
    <AdminPageHeader
      icon={<BarChart3 className="h-6 w-6" />}
      title="สถิติข้อสอบ"
      subtitle={examSubtitle}
      breadcrumbItems={[
        {
          href: "/admin/mock-exams",
          label: (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              ข้อสอบจำลอง
            </span>
          ),
        },
        {
          label: (
            <span className="inline-flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              สถิติข้อสอบ
            </span>
          ),
        },
      ]}
      onBack={() => router.back()}
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : !data || data.totalAttempts === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-400">
          ยังไม่มีคนทำข้อสอบชุดนี้ในโหมดสอบจริง — สถิติจะแสดงเมื่อมีข้อมูลเพียงพอ
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Users className="h-4 w-4" />} label="คนทำทั้งหมด" value={data.totalAttempts} />
            <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="อัตราผ่าน" value={data.passRate != null ? `${data.passRate}%` : "-"} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="คะแนนเฉลี่ย" value={data.avgPercentage != null ? `${data.avgPercentage}%` : "-"} />
            <StatCard
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              label="ข้อที่ควรทบทวน"
              value={flaggedCount}
              hint={flaggedCount > 0 ? "ยากเกินไป/ง่ายเกินไป/แยกแยะคนเก่ง-อ่อนไม่ได้" : "ไม่พบข้อที่มีปัญหา"}
            />
          </div>

          <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">การกระจายคะแนน</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.distributionBuckets}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <RechartsTooltip formatter={(value: number) => [`${value} คน`, "จำนวนคน"]} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">วิเคราะห์รายข้อ (Item Analysis)</h3>
              {!data.discriminationAvailable && (
                <span className="text-xs text-gray-400">ต้องมีคนทำอย่างน้อย 10 คนถึงจะคำนวณค่าอำนาจจำแนกได้</span>
              )}
            </div>

            <TooltipProvider delayDuration={200}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>คำถาม</TableHead>
                    <TableHead>หัวข้อ</TableHead>
                    <TableHead className="text-right">ตอบแล้ว</TableHead>
                    <TableHead className="text-right">ความยาก</TableHead>
                    <TableHead className="text-right">อำนาจจำแนก</TableHead>
                    <TableHead className="text-right">ตัวเลือกไม่มีคนเลือก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.questionStats.map((q, idx) => (
                    <TableRow key={q.id} className={q.isFlagged ? "bg-red-50/40" : ""}>
                      <TableCell className="text-sm text-gray-500">{idx + 1}</TableCell>
                      <TableCell className="max-w-md text-sm text-gray-900">
                        <div className="flex items-center gap-1.5">
                          {q.isFlagged && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>ข้อนี้อาจมีปัญหา — ควรตรวจสอบเฉลย/ความยาก</TooltipContent>
                            </Tooltip>
                          )}
                          <span className="line-clamp-1">{q.questionText}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{q.topic?.name || "-"}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">{q.answeredCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={difficultyTone(q.difficultyPercent)}>
                          {q.difficultyPercent != null ? `${q.difficultyPercent}%` : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={discriminationTone(q.discrimination)}>
                          {q.discrimination != null ? q.discrimination.toFixed(2) : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {q.deadDistractorCount > 0 ? (
                          <span className="text-amber-600">{q.deadDistractorCount} ตัวเลือก</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>

            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="detail">
                <AccordionTrigger className="text-sm font-medium text-gray-700">ดูสัดส่วนการเลือกตัวเลือกรายข้อ</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {data.questionStats
                      .filter((q) => q.optionStats.length > 0)
                      .map((q, idx) => (
                        <div key={q.id} className="rounded-lg border border-gray-100 p-3">
                          <p className="mb-2 text-sm font-medium text-gray-800">
                            {idx + 1}. {q.questionText}
                          </p>
                          <div className="space-y-1.5">
                            {q.optionStats.map((o) => (
                              <div key={o.id} className="flex items-center gap-2 text-xs">
                                <span className={`w-10 shrink-0 text-right ${o.pickedCount === 0 ? "text-amber-600" : "text-gray-500"}`}>
                                  {o.pickedPercent}%
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className={`h-full rounded-full ${o.isCorrect ? "bg-green-500" : "bg-gray-400"}`}
                                    style={{ width: `${Math.max(2, o.pickedPercent)}%` }}
                                  />
                                </div>
                                <span className={`flex-1 ${o.isCorrect ? "font-medium text-green-700" : "text-gray-600"}`}>{o.optionText}</span>
                                {o.pickedCount === 0 && <span className="text-amber-600">ไม่มีใครเลือก</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </>
      )}
    </AdminPageHeader>
  )
}
