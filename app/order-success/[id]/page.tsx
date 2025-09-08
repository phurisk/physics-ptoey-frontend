"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react"

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
  ebook?: { id: string; title: string; coverImageUrl?: string | null; isPhysical?: boolean; fileUrl?: string | null; previewUrl?: string | null }
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
  const ebookFileUrl = order?.orderType === "EBOOK" && order?.ebook && order.ebook.isPhysical !== true
    ? (order.ebook.fileUrl || order.ebook.previewUrl || null)
    : null

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
    if (s === "PENDING") return <Badge className="bg-yellow-400 text-white">รอการชำระ</Badge>
    if (s === "REJECTED" || s === "CANCELLED") return <Badge className="bg-red-600 text-white">ปฏิเสธ/ยกเลิก</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">ยืนยันการสั่งซื้อ</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/profile/orders")}>กลับไปหน้าคำสั่งซื้อ</Button>
          </div>
        </div>
        {loading && <div className="text-gray-600">กำลังโหลด...</div>}
        {!loading && error && <div className="text-red-600">{error}</div>}
      </div>

      {/* Step indicator */}
      {!loading && order && (
        <div className="bg-white/60 rounded-lg border p-4">
          {(() => {
            const s = (order?.status || "").toUpperCase()
            const step2Done = s === "COMPLETED"
            const step2Active = ["PENDING", "PENDING_VERIFICATION", "COMPLETED"].includes(s)
            const step3Done = s === "COMPLETED"
            const step2Label = s === "PENDING_VERIFICATION" ? "ตรวจสอบ" : "ชำระเงิน"
            return (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-max">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-yellow-700">สั่งซื้อ</span>
                </div>
                <div className={`h-0.5 flex-1 ${step2Active ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                <div className="flex items-center gap-2 min-w-max">
                  {step2Done ? (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-yellow-500 text-yellow-600">2</span>
                  )}
                  <span className={`text-sm font-medium ${step2Active ? 'text-yellow-700' : 'text-gray-500'}`}>{step2Label}</span>
                </div>
                <div className={`h-0.5 flex-1 ${step3Done ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                <div className="flex items-center gap-2 min-w-max">
                  {step3Done ? (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-600 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-200 text-gray-500">3</span>
                  )}
                  <span className={`text-sm font-medium ${step3Done ? 'text-green-700' : 'text-gray-500'}`}>สำเร็จ</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}
      {!loading && order && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : isPending ? (
                      <Clock className="h-6 w-6 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                    <CardTitle>คำสั่งซื้อ #{order.id}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">สถานะคำสั่งซื้อ:</span>
                    {statusBadge(order?.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">ประเภทสินค้า</div>
                    <div className="font-medium text-gray-900">{order.orderType === "COURSE" ? "คอร์สเรียน" : "หนังสือ"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">ยอดรวม</div>
                    <div className="font-semibold text-gray-900">฿{order.total.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">วันที่สั่งซื้อ</div>
                    <div className="text-gray-900">{new Date(order.createdAt).toLocaleString("th-TH")}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">หมายเลขคำสั่งซื้อ</div>
                    <div className="text-gray-900 inline-flex items-center gap-2">
                      <span className="font-medium">#{order.id}</span>
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(String(order.id))}>คัดลอก</Button>
                    </div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-sm text-gray-600">สินค้า</div>
                    <div className="font-medium text-gray-900">{order.course?.title || order.ebook?.title}</div>
                    {order.payment?.ref && (
                      <div className="text-sm text-gray-600 inline-flex items-center gap-2">เลขอ้างอิง: {order.payment.ref} <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(String(order.payment!.ref))}>คัดลอก</Button></div>
                    )}
                  </div>
                </div>

                {order.orderType === "EBOOK" && order.ebook?.isPhysical && (
                  <div className="mt-2 rounded-md border p-4 bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-800 font-medium mb-1">
                      <FileText className="h-4 w-4" /> สถานะการจัดส่ง
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2 text-sm text-gray-700">
                      <div>วิธีจัดส่ง: {order.shipping?.shippingMethod || "-"}</div>
                      <div>สถานะพัสดุ: {order.shipping?.status || "ยังไม่เริ่มจัดส่ง"}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {isPending && (
                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setOpenUpload(true)}>
                      อัพโหลดสลิป
                    </Button>
                  )}
                  {isCompleted && order.orderType === "COURSE" && courseId && (
                    <Button onClick={() => router.push(`/courses/${courseId}`)} className="bg-yellow-400 hover:bg-yellow-500 text-white">เข้าเรียน</Button>
                  )}
                  {isCompleted && order.orderType === "EBOOK" && ebookFileUrl && (
                    <>
                      <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-white"
                        onClick={() => {
                          const name = `${order.ebook?.title || "ebook"}.pdf`
                          const url = `/api/proxy-view?url=${encodeURIComponent(ebookFileUrl)}&filename=${encodeURIComponent(name)}`
                          window.open(url, "_blank")
                        }}
                      >
                        อ่าน eBook
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const name = `${order.ebook?.title || "ebook"}.pdf`
                          const url = `/api/proxy-download?url=${encodeURIComponent(ebookFileUrl)}&filename=${encodeURIComponent(name)}`
                          window.open(url, "_blank")
                        }}
                      >
                        ดาวน์โหลด eBook
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
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
                  <div className="flex flex-wrap items-center gap-4">
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

            {(isPending || paymentStatus === 'PENDING_VERIFICATION') && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>วิธีชำระเงินโดยการโอน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-6 w-[140px]">
                      <Image src="/kbank-logo.png" alt="ธนาคารกสิกรไทย" fill className="object-contain" />
                    </div>
                    <Badge className="bg-yellow-400 text-white">โอนผ่าน Mobile Banking</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">เลขบัญชี</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tracking-wider">107-889-8751</span>
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText('1078898751')}>คัดลอก</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">ชื่อบัญชี</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">นาย เชษฐา พวงบุบผา</span>
                        <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText('นาย เชษฐา พวงบุบผา')}>คัดลอก</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">ยอดที่ต้องชำระ</span>
                      <span className="font-semibold">฿{order.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">หลังโอนแล้ว กรุณาอัพโหลดสลิป ระบบจะตรวจสอบใช้เวลาโดยประมาณ 5-10 นาที</div>
                  <div className="pt-1">
                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-white w-full" onClick={() => setOpenUpload(true)}>อัพโหลดสลิป</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {uploadMsg && <div aria-live="polite" className={uploadMsg.includes("สำเร็จ") ? "text-green-600" : "text-red-600"}>{uploadMsg}</div>}
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
