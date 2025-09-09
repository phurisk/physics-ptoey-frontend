"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"

type Order = {
  id: string
  orderType: "COURSE" | "EBOOK"
  status: string
  subtotal: number
  shippingFee: number
  couponDiscount: number
  total: number
  createdAt: string
  payment?: { id: string; status: string; ref?: string; amount?: number; slipUrl?: string }
  course?: { title: string; description?: string | null; instructor?: { name?: string | null } | null }
  ebook?: { title: string; author?: string | null; coverImageUrl?: string | null }
}

type OrdersResponse = { success: boolean; data: Order[] }

export default function Orders() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const [openUpload, setOpenUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) { setLoading(false); return }
      try {
        setLoading(true)
        const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" })
        const json: OrdersResponse = await res.json().catch(() => ({ success: false, data: [] }))
        if (!res.ok || json.success === false) throw new Error((json as any)?.error || "โหลดคำสั่งซื้อไม่สำเร็จ")
        if (active) setOrders(Array.isArray(json.data) ? json.data : [])
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดคำสั่งซื้อไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user?.id])

  const orderStatusText = (status?: string) => {
    const s = (status || "").toUpperCase()
    if (s === "COMPLETED") return "ชำระเงินแล้ว"
    if (s === "PENDING_VERIFICATION") return "รอตรวจสอบสลิป"
    if (s === "PENDING") return "รอการชำระ"
    if (s === "CANCELLED") return "ยกเลิก"
    if (s === "REJECTED") return "ปฏิเสธ"
    return status || "-"
  }

  // สี badge ตามสถานะ (อ่านง่ายใน mobile)
  const statusTone = (status?: string) => {
    const s = (status || "").toUpperCase()
    if (s === "COMPLETED") return "bg-green-50 text-green-700 border border-green-200"
    if (s === "PENDING_VERIFICATION") return "bg-blue-50 text-blue-700 border border-blue-200"
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border border-amber-200"
    if (s === "CANCELLED" || s === "REJECTED") return "bg-red-50 text-red-700 border border-red-200"
    return "bg-gray-100 text-gray-700 border border-gray-200"
  }

  const onOpenUpload = (order: Order) => {
    setSelectedOrder(order)
    setFile(null)
    setUploadError(null)
    setUploadSuccess(null)
    setOpenUpload(true)
  }

  const handleUpload = async () => {
    if (!selectedOrder || !file) return
    try {
      setUploading(true)
      setUploadError(null)
      setUploadSuccess(null)
      const form = new FormData()
      form.append("orderId", selectedOrder.id)
      form.append("file", file)
      const res = await fetch(`/api/payments/upload-slip`, { method: "POST", body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "อัพโหลดไม่สำเร็จ")
      setUploadSuccess("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ")
      try {
        const r = await fetch(`/api/orders?userId=${encodeURIComponent(user!.id)}`, { cache: "no-store" })
        const j: OrdersResponse = await r.json().catch(() => ({ success: false, data: [] }))
        if (r.ok && j.success !== false) setOrders(j.data || [])
      } catch { }
    } catch (e: any) {
      setUploadError(e?.message ?? "อัพโหลดไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Loading Skeletons (ปรับสัดส่วนให้เหมือนภาพจริง) */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`o-sk-${i}`}>
              <CardContent className="p-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
                  {/* รูป: EBOOK (2:3) / COURSE (16:9) — ใช้ 2:3 เป็น default สวยกว่าในมือถือ */}
                  <div className="relative w-full sm:w-auto aspect-[2/3] rounded-md bg-gray-100 ring-1 ring-black/5 overflow-hidden">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2 sm:flex-col justify-self-stretch sm:justify-self-end">
                    <Skeleton className="h-9 w-full sm:w-28" />
                    <Skeleton className="h-9 w-full sm:w-28" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && <div className="text-red-600">เกิดข้อผิดพลาด: {error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="text-gray-600">ยังไม่มีคำสั่งซื้อ</div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((o) => {
            const isEbook = o.orderType === "EBOOK"
            const title =
              o.orderType === "COURSE"
                ? (o.course?.title || "คอร์สเรียน")
                : (o.ebook?.title || "หนังสือ")
            const thumb =
              isEbook ? (o.ebook?.coverImageUrl || "/placeholder.svg") : "/placeholder.svg"

            // คุมสัดส่วนรูปให้ “ตามภาพ” มากขึ้น:
            // - EBOOK: ปกหนังสือทั่วไป 2:3 (สูงกว่ากว้าง)
            // - COURSE: 16:9 (วิดีโอ/โปสเตอร์คอร์ส)
            const aspectClass = isEbook ? "aspect-[2/3]" : "aspect-video"

            const statusLabel = orderStatusText(o.status)
            const payStatus = o.payment?.status
            const isPending = ["PENDING", "PENDING_VERIFICATION"].includes(o.status)

            return (
              <Card key={o.id} className="shadow-sm">
                <CardContent className="p-4">
                  {/* ในมือถือ: เรียงเป็น 1 คอลัมน์ — รูปเต็มบรรทัด, เนื้อหา, ปุ่มกด */}
                  {/* ในเดสก์ท็อป: 3 คอลัมน์ — รูปคงที่, เนื้อหา, ปุ่มกด/สถานะ */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
                    {/* Thumbnail */}
                    <div className={`relative w-full sm:w-auto ${aspectClass} rounded-md bg-white ring-1 ring-black/5 overflow-hidden`}>
                      <Image
                        src={thumb}
                        alt={title}
                        fill
                        // ใช้ object-contain เพื่อ “ตามสัดส่วนจริงของรูป” ไม่บิด/ครอป
                        className="object-contain"
                        sizes="(max-width: 640px) 100vw, 8rem"
                        priority={false}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-gray-900 truncate mr-2">{title}</div>
                        <Badge className={`whitespace-nowrap ${statusTone(o.status)}`}>{statusLabel}</Badge>
                      </div>

                      <div className="text-sm text-gray-600 mt-1">
                        ยอดรวม ฿{o.total.toLocaleString()}
                      </div>

                      {/* สถานะชำระเงินย่อย */}
                      <div className="mt-1 text-xs text-gray-500">
                        สถานะตรวจสลิป:{" "}
                        {payStatus === "COMPLETED"
                          ? "ชำระแล้ว"
                          : payStatus === "PENDING_VERIFICATION"
                            ? "รอตรวจสอบ"
                            : payStatus === "REJECTED"
                              ? "ปฏิเสธ"
                              : "ยังไม่ได้อัพโหลด/รอชำระ"}
                      </div>

                      {o.payment?.ref && (
                        <div className="text-xs text-gray-500">เลขอ้างอิง: {o.payment.ref}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:flex-col sm:justify-self-end w-full">
                      <Link href={`/order-success/${o.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-28">
                          ดูรายละเอียด
                        </Button>
                      </Link>

                      {isPending ? (
                        <Button
                          onClick={() => onOpenUpload(o)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white w-full sm:w-28"
                        >
                          อัพโหลดสลิป
                        </Button>
                      ) : (
                        <Badge className="bg-green-600 text-white w-full sm:w-auto justify-center">
                          ชำระเงินแล้ว
                        </Badge>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Slip Modal (UI เดิม, ปรับปลีกย่อยนิดหน่อยให้อ่านง่าย) */}
      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              คำสั่งซื้อ: <span className="font-medium">{selectedOrder?.id}</span>{" "}
              ยอดชำระ:{" "}
              <span className="font-medium">
                ฿{selectedOrder?.total.toLocaleString()}
              </span>
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {uploadError && <div className="text-sm text-red-600">{uploadError}</div>}
            {uploadSuccess && <div className="text-sm text-green-600">{uploadSuccess}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenUpload(false)}>
                ยกเลิก
              </Button>
              <Button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="bg-yellow-400 hover:bg-yellow-500 text-white"
              >
                {uploading ? "กำลังอัพโหลด..." : "อัพโหลด"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
