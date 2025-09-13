"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { CheckCircle2, Clock, AlertCircle, FileText, RefreshCw, MapPin } from "lucide-react"
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
  course?: { id: string; title: string; isPhysical?: boolean }
  ebook?: {
    id: string
    title: string
    coverImageUrl?: string | null
    isPhysical?: boolean
    fileUrl?: string | null
    previewUrl?: string | null
  }
  payment?: {
    id: string
    status: string
    ref?: string
    amount?: number
    slipUrl?: string
    notes?: string
    uploadedAt?: string
  }
  shipping?: { shippingMethod?: string; status?: string }
  shippingAddress?: { name?: string; phone?: string; address?: string; district?: string; province?: string; postalCode?: string }
}

type OrderResponse = { success: boolean; data?: Order; error?: string }

function getSafeUserId(user: any): string | undefined {
  return (user?.id ?? user?.userId ?? user?._id ?? user?.uid) || undefined
}

function isPaidLikeStatus(s?: string) {
  const x = (s || "").toUpperCase()
  return ["COMPLETED", "PAID", "APPROVED", "SUCCESS"].includes(x)
}

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openUpload, setOpenUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [editingShipping, setEditingShipping] = useState(false)
  const [shipping, setShipping] = useState({ name: "", phone: "", address: "", district: "", province: "", postalCode: "" })
  const [shippingMsg, setShippingMsg] = useState<string | null>(null)
  const [ebookLink, setEbookLink] = useState<string | null>(null)

  const [enrollErr, setEnrollErr] = useState<string | null>(null)
  const triedEnrollRef = useRef(false)

  // ────────────────────────────────────────────────────────────────────────────
  // API helpers
  // ────────────────────────────────────────────────────────────────────────────
  async function fetchOrder(orderId: string) {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" })
    const text = await res.text().catch(() => "")
    let json: OrderResponse | null = null
    try { json = text ? JSON.parse(text) : null } catch {}
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || (text && text.slice(0, 300)) || `HTTP ${res.status}`)
    }
    return json.data!
  }

  // Normalize shipping from either order.shippingAddress (frontend JSON) or order.shipping (backend relation)
  const normalizedShipping = useMemo(() => {
    const s1: any = (order as any)?.shippingAddress
    if (s1 && (s1.name || s1.address || s1.district || s1.province || s1.postalCode)) {
      return {
        name: s1.name || "",
        phone: s1.phone || "",
        address: s1.address || "",
        district: s1.district || "",
        province: s1.province || "",
        postalCode: s1.postalCode || "",
      }
    }
    const s2: any = (order as any)?.shipping
    if (s2 && (s2.recipientName || s2.address || s2.district || s2.province || s2.postalCode)) {
      return {
        name: s2.recipientName || "",
        phone: s2.recipientPhone || "",
        address: s2.address || "",
        district: s2.district || "",
        province: s2.province || "",
        postalCode: s2.postalCode || "",
      }
    }
    return null
  }, [order])

  useEffect(() => {
    const s = normalizedShipping || {}
    setShipping({
      name: (s as any).name || "",
      phone: (s as any).phone || "",
      address: (s as any).address || "",
      district: (s as any).district || "",
      province: (s as any).province || "",
      postalCode: (s as any).postalCode || "",
    })
  }, [order?.id, normalizedShipping])

  async function pollUntilPaid(orderId: string, timeoutMs = 60_000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const o = await fetchOrder(orderId)
      const cur = (o?.payment?.status || o?.status || "").toUpperCase()
      if (isPaidLikeStatus(cur)) return o
      await new Promise((r) => setTimeout(r, 2500))
    }
    throw new Error("ยังไม่อนุมัติการชำระเงิน")
  }

  // ยิง enroll กับ 2 เอ็นพอยต์ (singular → plural)
  async function enrollUser(userId: string, courseId: string, orderId?: string) {
    const payload = { userId, courseId, orderId }

    // helper ยิง API แล้วอ่าน error จริง
    const doPost = async (url: string) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const text = await res.text().catch(() => "")
      let json: any = null
      try { json = text ? JSON.parse(text) : null } catch {}
      // /api/enrollment => { success: boolean, ... }
      // /api/enrollments => { enrollment, message } (ไม่มี success)
      const okLike = res.ok && (json?.success !== false)
      if (!okLike) {
        const msg = json?.error || json?.message || (text && text.slice(0, 300)) || `HTTP ${res.status}`
        throw new Error(msg)
      }
      return json
    }

    try {
      if (process.env.NODE_ENV !== "production") console.log("[Enroll] try /api/enrollment", payload)
      return await doPost("/api/enrollment")
    } catch (e1: any) {
      if (process.env.NODE_ENV !== "production") console.warn("[Enroll] fallback /api/enrollments →", e1?.message)
      // fallback ไป plural
      return await doPost("/api/enrollments")
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Initial load
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if (!id) return
        const data = await fetchOrder(String(id))
        if (active) setOrder(data)
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  

  // ────────────────────────────────────────────────────────────────────────────
  // Auto-enroll เฉพาะเมื่อชำระเงินแล้ว
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order) return
    if (triedEnrollRef.current) return

    const paymentStatus = (order?.payment?.status || order?.status || "").toUpperCase()
    const courseId = order?.orderType === "COURSE" ? order?.course?.id : undefined
    const userId = getSafeUserId(user)

    if (isPaidLikeStatus(paymentStatus) && courseId && userId) {
      triedEnrollRef.current = true
      setEnrollErr(null)
      ;(async () => {
        try {
          await enrollUser(userId, courseId, order.id)
          // enroll สำเร็จ — เลือกพาไปหน้าเรียนหรือปล่อยให้กดปุ่ม "เข้าเรียน"
          // router.push(`/courses/${courseId}`)
        } catch (e: any) {
          setEnrollErr(e?.message || "Enroll ไม่สำเร็จ")
          triedEnrollRef.current = false // ให้ผู้ใช้กด manual retry ได้
        }
      })()
    }
  }, [order, user])

  // ────────────────────────────────────────────────────────────────────────────
  // Upload slip → poll → setOrder (enroll จะเกิดจาก useEffect ด้านบนเอง)
  // ────────────────────────────────────────────────────────────────────────────
  const uploadSlip = async () => {
    if (!order || !file) return
    try {
      setUploading(true)
      setUploadMsg(null)
      const form = new FormData()
      form.append("orderId", order.id)
      form.append("file", file)
      const res = await fetch(`/api/payments/upload-slip`, { method: "POST", body: form })
      const text = await res.text().catch(() => "")
      let json: any = null
      try { json = text ? JSON.parse(text) : null } catch {}
      if (!res.ok || json?.success === false) {
        const msg = json?.error || (text && text.slice(0, 300)) || `HTTP ${res.status}`
        throw new Error(msg)
      }
      // แจ้งผลสำเร็จแบบย่อ ปิดป๊อปอัปอัตโนมัติ แล้วรีเฟรชคำสั่งซื้อ
      setUploadMsg("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ…")
      setOpenUpload(false)
      setFile(null)
      await refreshOrder() // อัปเดตสถานะให้เห็นว่า "รอตรวจสอบสลิป"
    } catch (e: any) {
      setUploadMsg(e?.message ?? "อัพโหลดไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  // Build preview image when user picks a file
  useEffect(() => {
    if (!file) {
      if (filePreview) {
        try { URL.revokeObjectURL(filePreview) } catch {}
      }
      setFilePreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setFilePreview(url)
    return () => {
      try { URL.revokeObjectURL(url) } catch {}
    }
  }, [file])

  const refreshOrder = async () => {
    if (!order?.id) return
    try {
      setLoading(true)
      const data = await fetchOrder(order.id)
      setOrder(data)
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ────────────────────────────────────────────────────────────────────────────
  const statusBadge = (status?: string) => {
    const s = (status || "").toUpperCase()
    if (isPaidLikeStatus(s)) return <Badge className="bg-green-600 text-white">ชำระเงินแล้ว</Badge>
    if (s === "PENDING_VERIFICATION") return <Badge className="bg-yellow-500 text-white">รอตรวจสอบสลิป</Badge>
    if (s === "PENDING") return <Badge className="bg-yellow-400 text-white">รอการชำระ</Badge>
    if (s === "REJECTED" || s === "CANCELLED") return <Badge className="bg-red-600 text-white">ปฏิเสธ/ยกเลิก</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }

  const isPending = ["PENDING", "PENDING_VERIFICATION"].includes((order?.status || "").toUpperCase())
  const isCompleted =
    isPaidLikeStatus(order?.status) || isPaidLikeStatus(order?.payment?.status)

  const paymentStatus = (order?.payment?.status || order?.status || "").toUpperCase()
  const courseId = order?.orderType === "COURSE" ? order?.course?.id : undefined
  const ebookFileUrl =
    order?.orderType === "EBOOK" && order?.ebook
      ? order.ebook.fileUrl || order.ebook.previewUrl || null
      : null
  const slipUrl = order?.payment?.slipUrl

  const needsShipping = useMemo(() => {
    if (!order) return false
    if ((order as any)?.shipping) return true
    if ((order as any)?.shippingFee > 0) return true
    if (order.orderType === "EBOOK") return order.ebook?.isPhysical === true
    if (order.orderType === "COURSE") return (order as any)?.course?.isPhysical === true
    return false
  }, [order])

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

  const canManualEnroll =
    isCompleted && order?.orderType === "COURSE" && courseId && isAuthenticated && !!getSafeUserId(user)


  const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const completed = isPaidLikeStatus(order?.status) || isPaidLikeStatus(order?.payment?.status)
        if (!order || !completed || order.orderType !== 'EBOOK') return
        if (ebookFileUrl) { setEbookLink(ebookFileUrl); return }
        const eid = order.ebook?.id
        if (!eid) return
        const res = await fetch(`/api/ebooks/${encodeURIComponent(String(eid))}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({} as any))
        const link = json?.data?.previewUrl || null
        if (!cancelled) setEbookLink(link)
      } catch { }
    })()
    return () => { cancelled = true }
  }, [order, ebookFileUrl])

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">ยืนยันการสั่งซื้อ</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/profile/orders")}>กลับไปหน้าคำสั่งซื้อ</Button>
            <Button variant="outline" onClick={refreshOrder} className="gap-2">
              <RefreshCw className="h-4 w-4" /> รีเฟรชสถานะ
            </Button>
          </div>
        </div>
        {loading && <div className="text-gray-600">กำลังโหลด...</div>}
        {!loading && error && <div className="text-red-600">{error}</div>}
        {enrollErr && (
          <div className="text-red-600 text-sm">ลงทะเบียนอัตโนมัติไม่สำเร็จ: {enrollErr}</div>
        )}
      </div>

      {!loading && order && (
        <>
         
          <div className="bg-white/60 rounded-lg border p-4">
            {(() => {
              const s = (order?.status || "").toUpperCase()
              const step2Done = isPaidLikeStatus(s)
              const step2Active = ["PENDING", "PENDING_VERIFICATION", "COMPLETED", "PAID", "APPROVED", "SUCCESS"].includes(s)
              const step3Done = step2Done
              const step2Label = s === "PENDING_VERIFICATION" ? "ตรวจสอบ" : "ชำระเงิน"
              return (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-max">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-yellow-700">สั่งซื้อ</span>
                  </div>
                  <div className={`h-0.5 flex-1 ${step2Active ? "bg-yellow-500" : "bg-gray-200"}`} />
                  <div className="flex items-center gap-2 min-w-max">
                    {step2Done ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-yellow-500 text-yellow-600">2</span>
                    )}
                    <span className={`text-sm font-medium ${step2Active ? "text-yellow-700" : "text-gray-500"}`}>{step2Label}</span>
                  </div>
                  <div className={`h-0.5 flex-1 ${step3Done ? "bg-yellow-500" : "bg-gray-200"}`} />
                  <div className="flex items-center gap-2 min-w-max">
                    {step3Done ? (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-600 text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-200 text-gray-500">3</span>
                    )}
                    <span className={`text-sm font-medium ${step3Done ? "text-green-700" : "text-gray-500"}`}>สำเร็จ</span>
                  </div>
                </div>
              )
            })()}
          </div>

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
                      <span className="text-sm text-gray-600">สถานะ:</span>
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
                        <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                          เลขอ้างอิง: {order.payment.ref}
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(String(order.payment!.ref))}>คัดลอก</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {needsShipping && (
                    <div className="space-y-2 border-t pt-4 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium inline-flex items-center">
                          <MapPin className="h-4 w-4 mr-2" /> ที่อยู่จัดส่ง
                        </div>
                      </div>

                      {normalizedShipping ? (
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {normalizedShipping.name} • {normalizedShipping.phone}
                          {"\n"}
                          {normalizedShipping.address}
                          {"\n"}
                          {normalizedShipping.district} {normalizedShipping.province} {normalizedShipping.postalCode}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">ไม่ได้เพิ่มที่อยู่จัดส่ง</div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {isPending && (
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setOpenUpload(true)}>
                        อัพโหลดสลิป
                      </Button>
                    )}

                    {isCompleted && order.orderType === "COURSE" && courseId && (
                      <>
                        <Button onClick={() => router.push(`/profile/my-courses/course/${courseId}`)} className="bg-yellow-400 hover:bg-yellow-500 text-white">
                          เข้าเรียน
                        </Button>
                        {canManualEnroll && (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              setEnrollErr(null)
                              try {
                                await enrollUser(getSafeUserId(user)!, courseId, order.id)
                              } catch (e: any) {
                                setEnrollErr(e?.message || "Enroll ไม่สำเร็จ")
                              }
                            }}
                          >
                            ลองลงทะเบียนอีกครั้ง
                          </Button>
                        )}
                      </>
                    )}

                    {isCompleted && order.orderType === "EBOOK" && (ebookFileUrl || ebookLink) && (
                      <>
                        <Button
                          className="bg-yellow-400 hover:bg-yellow-500 text-white"
                          onClick={() => {
                            const name = `${order.ebook?.title || "ebook"}.pdf`
                            const url = `/api/proxy-view?url=${encodeURIComponent(ebookFileUrl || ebookLink || "")}&filename=${encodeURIComponent(name)}`
                            window.open(url, "_blank")
                          }}
                        >
                          อ่าน eBook
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const name = `${order.ebook?.title || "ebook"}.pdf`
                            const url = `/api/proxy-download?url=${encodeURIComponent(ebookFileUrl || ebookLink || "")}&filename=${encodeURIComponent(name)}`
                            window.open(url, "_blank")
                          }}
                        >
                          ดาวน์โหลด eBook
                        </Button>
                      </>
                    )}
                  </div>

                  {isCompleted && order.orderType === "COURSE" && !isAuthenticated && (
                    <div className="text-sm text-amber-600">โปรดเข้าสู่ระบบเพื่อเปิดสิทธิ์เรียนอัตโนมัติ</div>
                  )}
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
                    <div className="text-sm text-gray-700">สถานะคำสั่งซื้อ:</div>
                    {statusBadge(paymentStatus)}
                  </div>

                  {slipUrl && (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative h-24 w-40 overflow-hidden rounded border">
                        <Image src={slipUrl} alt="สลิปโอนเงิน" fill className="object-cover" />
                      </div>
                      <a href={slipUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                        เปิดสลิปต้นฉบับ
                      </a>
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
                        <div className="sm:col-span-2 text-gray-700">
                          สรุปการตรวจสอบ: ผ่าน {slipInfo.summary.passed || 0} • เตือน {slipInfo.summary.warnings || 0} • ไม่ผ่าน {slipInfo.summary.failed || 0}
                        </div>
                      )}
                    </div>
                  )}

                  {!slipUrl && (
                    <div className="text-sm text-gray-600">ยังไม่มีสลิปกรอกเข้ามา กรุณาอัพโหลดหลักฐานการชำระเงิน</div>
                  )}
                </CardContent>
              </Card>

              {(isPending || paymentStatus === "PENDING_VERIFICATION") && (
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
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText("1078898751")}>คัดลอก</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">ชื่อบัญชี</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">นาย เชษฐา พวงบุบผา</span>
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText("นาย เชษฐา พวงบุบผา")}>คัดลอก</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">ยอดที่ต้องชำระ</span>
                        <span className="font-semibold">฿{order.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">หลังโอนแล้ว กรุณาอัพโหลดสลิป ระบบจะตรวจสอบใช้เวลาโดยประมาณ 5-10 นาที</div>
                    <div className="pt-1">
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-white w-full" onClick={() => setOpenUpload(true)}>
                        อัพโหลดสลิป
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

      
          <Dialog open={openUpload} onOpenChange={setOpenUpload}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {filePreview && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">ตัวอย่างรูปที่เลือก</div>
                    <div className="relative border rounded-md overflow-hidden bg-gray-50">
                      <img src={filePreview} alt="ตัวอย่างสลิป" className="max-h-72 w-full object-contain" />
                    </div>
                  </div>
                )}
                {uploadMsg && (
                  <div aria-live="polite" className={uploadMsg.includes("สำเร็จ") || uploadMsg.includes("อนุมัติ") ? "text-green-600" : "text-red-600"}>
                    {uploadMsg}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenUpload(false)}>ปิด</Button>
                  <Button disabled={!file || uploading} onClick={uploadSlip} className="bg-yellow-400 hover:bg-yellow-500 text-white">
                    {uploading ? "กำลังอัพโหลด..." : "อัพโหลดสลิป"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
