"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
      form.append("slip", file)
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
              <Badge variant="secondary">สถานะ: {order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">ประเภทสินค้า: {order.orderType === "COURSE" ? "คอร์สเรียน" : "หนังสือ"}</div>
              <div className="text-sm text-gray-600">สินค้า: {order.course?.title || order.ebook?.title}</div>
              <div className="text-sm text-gray-600">ยอดรวม: ฿{order.total.toLocaleString()}</div>
              {order.payment?.ref && <div className="text-sm text-gray-600">เลขอ้างอิง: {order.payment.ref}</div>}
            </div>

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
