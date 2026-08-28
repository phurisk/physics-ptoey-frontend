"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import http from "@/lib/http"

type MockExam = {
  id: string
  title: string
  price: number
  discountPrice?: number | null
}

export default function CheckoutMockExamPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [exam, setExam] = useState<MockExam | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (authLoading) return
        if (!isAuthenticated) {
          router.push(`/mock-exams/${id}`)
          return
        }
        const accessRes = await http.get(`/api/mock-exams/${id}/access`)
        if (active && accessRes.data?.data?.hasAccess) {
          router.replace(`/mock-exams/${id}`)
          return
        }
        const res = await http.get(`/api/mock-exams/${id}`)
        if (active && res.data?.success) setExam(res.data.data)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id, isAuthenticated, authLoading, router])

  const price = exam ? (exam.discountPrice && exam.discountPrice < exam.price ? exam.discountPrice : exam.price) : 0

  const confirmOrder = async () => {
    if (!exam) return
    setCreating(true)
    setError(null)
    try {
      const res = await http.post("/api/orders", {
        items: [{ itemType: "MOCK_EXAM", itemId: exam.id, title: exam.title, quantity: 1 }],
      })
      const json = res.data || {}
      if (json?.success === false) throw new Error(json?.error || "สร้างคำสั่งซื้อไม่สำเร็จ")
      router.push(`/order-success/${encodeURIComponent(String(json.data.orderId))}`)
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "สร้างคำสั่งซื้อไม่สำเร็จ")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="mx-auto max-w-xl px-4 py-16 text-center text-muted-foreground">กำลังโหลด...</div>
  if (!exam) return <div className="mx-auto max-w-xl px-4 py-16 text-center text-muted-foreground">ไม่พบข้อสอบจำลอง</div>

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">ยืนยันการซื้อข้อสอบจำลอง</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{exam.title}</span>
            <Badge>สอบจริง</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ยอดชำระ</span>
            <span className="text-lg font-semibold text-foreground">฿{price.toLocaleString()}</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              ยกเลิก
            </Button>
            <Button onClick={confirmOrder} disabled={creating}>
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังสร้างคำสั่งซื้อ...
                </span>
              ) : (
                "ยืนยันการสั่งซื้อ"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
