"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Clock, FileQuestion, DollarSign, ShieldCheck, Dumbbell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSubjectLabel } from "@/lib/constants"
import { http } from "@/lib/http"
import { useAuth } from "@/components/auth-provider"
import LoginModal from "@/components/login-modal"

type MockExamDetail = {
  id: string
  title: string
  description?: string | null
  subject: string
  timeLimit?: number | null
  price: number
  discountPrice?: number | null
  attemptsAllowed: number
  allowPracticeMode: boolean
  allowRealMode: boolean
  course?: { id: string; title: string } | null
  _count?: { questions: number }
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount)

export default function MockExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [exam, setExam] = useState<MockExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [starting, setStarting] = useState<"PRACTICE" | "REAL" | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await http.get(`/api/mock-exams/${id}`)
        if (active && res.data?.success) setExam(res.data.data)

        if (isAuthenticated) {
          const accessRes = await http.get(`/api/mock-exams/${id}/access`)
          if (active && accessRes.data?.success) setHasAccess(accessRes.data.data.hasAccess)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id, isAuthenticated])

  const startAttempt = async (mode: "PRACTICE" | "REAL") => {
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    if (mode === "REAL" && exam?.price && !hasAccess) {
      router.push(`/checkout/mock-exam/${id}`)
      return
    }
    setStarting(mode)
    try {
      const res = await http.post(`/api/mock-exams/${id}/attempts`, { mode })
      if (res.data?.success) {
        router.push(`/mock-exams/attempt/${res.data.data.attemptId}`)
      }
    } finally {
      setStarting(null)
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">กำลังโหลด...</div>
  if (!exam) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">ไม่พบข้อสอบจำลอง</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Badge variant="outline" className="mb-3">
        {getSubjectLabel(exam.subject)}
      </Badge>
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-foreground">
        <FileQuestion className="h-6 w-6 text-primary" />
        {exam.title}
      </h1>
      {exam.description && <p className="mb-6 text-muted-foreground">{exam.description}</p>}

      <div className="mb-6 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border p-3 text-center">
          <div className="font-semibold text-foreground">{exam._count?.questions ?? 0}</div>
          <div className="text-muted-foreground">ข้อ</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="flex items-center justify-center gap-1 font-semibold text-foreground">
            <Clock className="h-4 w-4" />
            {exam.timeLimit ? `${exam.timeLimit} นาที` : "ไม่จำกัด"}
          </div>
          <div className="text-muted-foreground">เวลาสอบจริง</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="font-semibold text-foreground">{exam.attemptsAllowed}</div>
          <div className="text-muted-foreground">ครั้ง (สอบจริง)</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {exam.allowPracticeMode && (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 p-5">
              <Dumbbell className="h-8 w-8 text-blue-500" />
              <h3 className="font-semibold text-foreground">โหมดฝึกซ้อม</h3>
              <p className="text-sm text-muted-foreground">ทำได้ไม่จำกัดครั้ง ใช้โทเคนปลดล็อกทีละข้อ ดูเฉลยได้ทันที</p>
              <Button className="w-full" variant="outline" disabled={starting === "PRACTICE"} onClick={() => startAttempt("PRACTICE")}>
                {starting === "PRACTICE" ? "กำลังเริ่ม..." : "เริ่มฝึกซ้อม"}
              </Button>
            </CardContent>
          </Card>
        )}
        {exam.allowRealMode && (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 p-5">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-foreground">โหมดสอบจริง</h3>
              <p className="text-sm text-muted-foreground">จับเวลา ดูผลหลังส่งข้อสอบเท่านั้น</p>
              {exam.price > 0 && !hasAccess && (
                <div className="flex items-center gap-1 font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(exam.discountPrice || exam.price)}
                </div>
              )}
              <Button className="w-full" disabled={starting === "REAL"} onClick={() => startAttempt("REAL")}>
                {starting === "REAL" ? "กำลังเริ่ม..." : exam.price > 0 && !hasAccess ? "ซื้อเพื่อสอบจริง" : "เริ่มสอบจริง"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
