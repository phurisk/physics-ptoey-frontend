"use client"

import { useEffect, useMemo, useState } from "react"
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

  // Upload slip modal
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

  const pendingOrders = useMemo(() => orders.filter(o => ["PENDING", "PENDING_VERIFICATION"].includes(o.status)), [orders])

  const orderStatusText = (status?: string) => {
    const s = (status || "").toUpperCase()
    if (s === "COMPLETED") return "ชำระเงินแล้ว"
    if (s === "PENDING_VERIFICATION") return "รอตรวจสอบสลิป"
    if (s === "PENDING") return "รอการชำระ"
    if (s === "CANCELLED") return "ยกเลิก"
    if (s === "REJECTED") return "ปฏิเสธ"
    return status || "-"
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
      // Refresh orders after upload
      try {
        const r = await fetch(`/api/orders?userId=${encodeURIComponent(user!.id)}`, { cache: "no-store" })
        const j: OrdersResponse = await r.json().catch(() => ({ success: false, data: [] }))
        if (r.ok && j.success !== false) setOrders(j.data || [])
      } catch {}
    } catch (e: any) {
      setUploadError(e?.message ?? "อัพโหลดไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`o-sk-${i}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-16 w-24" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-9 w-28" />
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
            const title = o.orderType === "COURSE" ? (o.course?.title || "คอร์สเรียน") : (o.ebook?.title || "หนังสือ")
            const thumb = o.orderType === "EBOOK" ? (o.ebook?.coverImageUrl || "/placeholder.svg") : "/placeholder.svg"
            const statusLabel = orderStatusText(o.status)
            const payStatus = o.payment?.status
            const isPending = ["PENDING", "PENDING_VERIFICATION"].includes(o.status)
            return (
              <Card key={o.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="relative h-16 w-24 overflow-hidden rounded">
                    <Image src={thumb} alt={title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{title}</div>
                    <div className="text-sm text-gray-600">ยอดรวม ฿{o.total.toLocaleString()} • สถานะคำสั่งซื้อ: <span className="font-medium">{statusLabel}</span></div>
                    <div className="text-xs text-gray-500 mt-0.5">สถานะตรวจสลิป: {payStatus === 'COMPLETED' ? 'ชำระแล้ว' : payStatus === 'PENDING_VERIFICATION' ? 'รอตรวจสอบ' : payStatus === 'REJECTED' ? 'ปฏิเสธ' : 'ยังไม่ได้อัพโหลด/รอชำระ'}</div>
                    {o.payment?.ref && (
                      <div className="text-xs text-gray-500">เลขอ้างอิง: {o.payment.ref}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/order-success/${o.id}`}>
                      <Button variant="outline">ดูรายละเอียด</Button>
                    </Link>
                    {isPending ? (
                      <Button onClick={() => onOpenUpload(o)} className="bg-yellow-400 hover:bg-yellow-500 text-white">อัพโหลดสลิป</Button>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">ชำระเงินแล้ว</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              คำสั่งซื้อ: <span className="font-medium">{selectedOrder?.id}</span>{" "}
              ยอดชำระ: <span className="font-medium">฿{selectedOrder?.total.toLocaleString()}</span>
            </div>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {uploadError && <div className="text-sm text-red-600">{uploadError}</div>}
            {uploadSuccess && <div className="text-sm text-green-600">{uploadSuccess}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenUpload(false)}>ยกเลิก</Button>
              <Button disabled={!file || uploading} onClick={handleUpload} className="bg-yellow-400 hover:bg-yellow-500 text-white">
                {uploading ? "กำลังอัพโหลด..." : "อัพโหลด"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
