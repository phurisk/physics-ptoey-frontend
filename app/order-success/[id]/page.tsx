"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

type Order = {
  id: string
  orderType: "COURSE" | "EBOOK"
  status: string
  subtotal: number
  shippingFee: number
  couponDiscount: number
  total: number
  createdAt: string
  course?: { id: string; title: string }
  ebook?: { id: string; title: string; coverImageUrl?: string | null; isPhysical?: boolean }
  payment?: { id: string; status: string; ref?: string; amount?: number; slipUrl?: string }
    & { notes?: string; uploadedAt?: string }
  shipping?: { shippingMethod?: string; status?: string }
}

type OrderResponse = { success: boolean; data?: Order; error?: string }

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openUpload, setOpenUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (!id) return
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
        const json: OrderResponse = await res.json().catch(() => ({ success: false }))
        if (!res.ok || json.success === false) throw new Error(json?.error || `ไม่พบคำสั่งซื้อ #${id}`)
        if (active) setOrder(json.data || null)
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  const uploadSlip = async () => {
    if (!order || !file) return
    try {
      setUploading(true)
      setUploadMsg(null)
      const form = new FormData()
      form.append("orderId", order.id)
      form.append("file", file)
      const res = await fetch(`/api/payments/upload-slip`, { method: "POST", body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "อัพโหลดไม่สำเร็จ")
      setUploadMsg("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ")
    } catch (e: any) {
      setUploadMsg(e?.message ?? "อัพโหลดไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  const isPending = ["PENDING", "PENDING_VERIFICATION"].includes(order?.status || "")
  const isCompleted = (order?.status || "") === "COMPLETED"
  const courseId = order?.orderType === "COURSE" ? order?.course?.id : undefined

  const paymentStatus = order?.payment?.status || order?.status
  const slipUrl = order?.payment?.slipUrl
  const slipInfo = useMemo(() => {
    try {
      const n = order?.payment?.notes ? JSON.parse(order.payment.notes) : null
      if (!n || typeof n !== "object") return null
      const slipOKSuccess = n?.slipOKResult?.success ?? n?.slipOKSuccess ?? null
      const detectedAmount = n?.slipOKResult?.data?.amount ?? n?.detectedAmount ?? null
      const detectedDate = n?.slipOKResult?.data?.date ?? n?.detectedDate ?? null
      const summary = n?.validation?.summary ?? n?.validationSummary ?? null
      return { slipOKSuccess, detectedAmount, detectedDate, summary }
    } catch {
      return null
    }
  }, [order?.payment?.notes])

  const statusBadge = (status?: string) => {
    const s = (status || "").toUpperCase()
    if (s === "COMPLETED") return <Badge className="bg-green-600 text-white">ชำระเงินแล้ว</Badge>
    if (s === "PENDING_VERIFICATION") return <Badge className="bg-yellow-500 text-white">รอตรวจสอบสลิป</Badge>
    if (s === "PENDING") return <Badge variant="secondary">รอการชำระ</Badge>
    if (s === "REJECTED" || s === "CANCELLED") return <Badge className="bg-red-600 text-white">ปฏิเสธ/ยกเลิก</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">รายละเอียดคำสั่งซื้อ</h1>
        {loading && <div className="text-gray-600">กำลังโหลด...</div>}
        {!loading && error && <div className="text-red-600">{error}</div>}
      </div>
      {!loading && order && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>คำสั่งซื้อ #{order.id}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">สถานะคำสั่งซื้อ:</span>
                {statusBadge(order?.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">ประเภทสินค้า: {order.orderType === "COURSE" ? "คอร์สเรียน" : "หนังสือ"}</div>
              <div className="text-sm text-gray-600">สินค้า: {order.course?.title || order.ebook?.title}</div>
              <div className="text-sm text-gray-600">ยอดรวม: ฿{order.total.toLocaleString()}</div>
              {order.payment?.ref && <div className="text-sm text-gray-600">เลขอ้างอิง: {order.payment.ref}</div>}
            </div>

            {order.orderType === "EBOOK" && order.ebook?.isPhysical && (
              <div className="mt-3 rounded-md border p-3 bg-gray-50">
                <div className="text-sm font-medium text-gray-800 mb-1">สถานะการจัดส่ง</div>
                <div className="text-sm text-gray-700">วิธีจัดส่ง: {order.shipping?.shippingMethod || "-"}</div>
                <div className="text-sm text-gray-700">สถานะพัสดุ: {order.shipping?.status || "ยังไม่เริ่มจัดส่ง"}</div>
              </div>
            )}

            {isPending && (
              <div className="space-y-3">
                <div className="text-gray-800 font-medium">โอนเงินแล้ว? อัพโหลดหลักฐานการชำระเงิน</div>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setOpenUpload(true)}>อัพโหลดสลิป</Button>
              </div>
            )}

            {isCompleted && order.orderType === "COURSE" && courseId && (
              <Button onClick={() => router.push(`/courses/${courseId}`)} className="bg-yellow-400 hover:bg-yellow-500 text-white">เข้าเรียน</Button>
            )}

            <div className="pt-2">
              <Button variant="outline" onClick={() => router.push("/profile/orders")}>กลับไปหน้าคำสั่งซื้อ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && order && (
        <Card>
          <CardHeader>
            <CardTitle>สถานะการตรวจสลิป</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">สถานะ:</div>
              {statusBadge(paymentStatus)}
            </div>
            {slipUrl && (
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-40 overflow-hidden rounded border">
                  <Image src={slipUrl} alt="สลิปโอนเงิน" fill className="object-cover" />
                </div>
                <a href={slipUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">เปิดสลิปต้นฉบับ</a>
              </div>
            )}
            {slipInfo && (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>ผลตรวจ SlipOK: <span className="font-medium">{slipInfo.slipOKSuccess ? "สำเร็จ" : "ไม่สำเร็จ"}</span></div>
                {typeof slipInfo.detectedAmount !== "undefined" && slipInfo.detectedAmount !== null && (
                  <div>จำนวนเงินที่ตรวจพบ: <span className="font-medium">฿{Number(slipInfo.detectedAmount).toLocaleString()}</span></div>
                )}
                {slipInfo.detectedDate && (
                  <div>วันที่โอนที่ตรวจพบ: <span className="font-medium">{String(slipInfo.detectedDate)}</span></div>
                )}
                {slipInfo.summary && (
                  <div className="sm:col-span-2 text-gray-700">สรุปการตรวจสอบ: ผ่าน {slipInfo.summary.passed || 0} • เตือน {slipInfo.summary.warnings || 0} • ไม่ผ่าน {slipInfo.summary.failed || 0}</div>
                )}
              </div>
            )}
            {!slipUrl && (
              <div className="text-sm text-gray-600">ยังไม่มีสลิปกรอกเข้ามา กรุณาอัพโหลดหลักฐานการชำระเงิน</div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {uploadMsg && <div className={uploadMsg.includes("สำเร็จ") ? "text-green-600" : "text-red-600"}>{uploadMsg}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenUpload(false)}>ปิด</Button>
              <Button disabled={!file || uploading} onClick={uploadSlip} className="bg-yellow-400 hover:bg-yellow-500 text-white">
                {uploading ? "กำลังอัพโหลด..." : "อัพโหลดสลิป"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
