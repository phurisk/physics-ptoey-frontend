"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileQuestion, Clock, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectOptions, getSubjectLabel } from "@/lib/constants"
import { http } from "@/lib/http"

type MockExam = {
  id: string
  title: string
  description?: string | null
  subject: string
  timeLimit?: number | null
  price: number
  discountPrice?: number | null
  course?: { id: string; title: string } | null
  _count?: { questions: number }
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount)

export default function MockExamsPage() {
  const [exams, setExams] = useState<MockExam[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("all")

  useEffect(() => {
    let active = true
    setLoading(true)
    http
      .get("/api/mock-exams", { params: { limit: 24, subject: subject !== "all" ? subject : undefined } })
      .then((res) => {
        if (active && res.data?.success) setExams(res.data.data)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [subject])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FileQuestion className="h-6 w-6 text-primary" />
            ข้อสอบจำลอง
          </h1>
          <p className="mt-1 text-muted-foreground">ฝึกซ้อมทำข้อสอบแบบไม่จำกัด หรือทดสอบตัวเองด้วยโหมดสอบจริงจับเวลา</p>
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกวิชา</SelectItem>
            {getSubjectOptions().map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">ยังไม่มีข้อสอบจำลองในขณะนี้</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/mock-exams/${exam.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2">
                    {getSubjectLabel(exam.subject)}
                  </Badge>
                  <h3 className="mb-1 line-clamp-2 font-semibold text-foreground">{exam.title}</h3>
                  {exam.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{exam.description}</p>}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{exam._count?.questions ?? 0} ข้อ</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.timeLimit ? `${exam.timeLimit} นาที` : "ไม่จำกัดเวลา"}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-bold text-primary">
                    {exam.price ? (
                      <>
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(exam.discountPrice || exam.price)}
                      </>
                    ) : (
                      <span className="text-green-600">ฟรี</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
