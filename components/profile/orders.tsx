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
import http from "@/lib/http"
import { toast } from "@/hooks/use-toast"

type Order = {
  id: string
  orderNumber?: string | null
  orderType: "COURSE" | "EBOOK"
  status: string
  subtotal: number
  shippingFee: number
  couponDiscount: number
  total: number
  createdAt: string
  courseId?: string
  ebookId?: string
  payment?: { id: string; status: string; ref?: string; amount?: number; slipUrl?: string }
  course?: { title: string; description?: string | null; instructor?: { name?: string | null } | null; coverImageUrl?: string | null }
  ebook?: { title: string; author?: string | null; coverImageUrl?: string | null }
  items?: Array<{ id?: string; itemType?: string; itemId?: string; title?: string | null; quantity?: number | null; unitPrice?: number | null; totalPrice?: number | null }>
}

type OrdersResponse = { success: boolean; data: Order[] }

const formatCurrency = (value?: number | null) => {
  const numeric = Number(value ?? 0)
  const safe = Number.isFinite(numeric) ? numeric : 0
  return `฿${safe.toLocaleString()}`
}

export default function Orders() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [itemAssets, setItemAssets] = useState<Record<string, string>>({})

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
        const res = await http.get(`/api/orders`, { params: { userId: user.id } })
        const json: OrdersResponse = res.data || { success: false, data: [] }
        if ((res.status < 200 || res.status >= 300) || json.success === false) throw new Error((json as any)?.error || "โหลดคำสั่งซื้อไม่สำเร็จ")
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

  useEffect(() => {
    if (!orders.length) return
    let cancelled = false

    const collectItems = (order: Order) => {
      const raw = Array.isArray(order.items) ? order.items.filter(Boolean) : []
      if (raw.length) return raw

      const fallback: NonNullable<Order["items"]> = []
      if (order.course || (order as any).courseId) {
        fallback.push({
          itemType: "COURSE",
          itemId: (order as any).courseId,
          title: order.course?.title,
          quantity: 1,
          totalPrice: order.total,
        })
      }
      if (order.ebook || (order as any).ebookId) {
        fallback.push({
          itemType: "EBOOK",
          itemId: (order as any).ebookId,
          title: order.ebook?.title,
          quantity: 1,
          totalPrice: order.total,
        })
      }
      return fallback
    }

    const loadAssets = async () => {
      const toFetch: Array<{ key: string; type: string; id: string }> = []

      for (const order of orders) {
        const items = collectItems(order)
        for (const item of items) {
          const type = String(item?.itemType || order.orderType || "").toUpperCase()
          const itemId = item?.itemId || (type === "COURSE" ? (order as any).courseId : (order as any).ebookId) || ""
          if (!itemId) continue
          const key = `${type}:${itemId}`
          if (itemAssets[key] === undefined) {
            toFetch.push({ key, type, id: itemId })
          }
        }
      }

      if (!toFetch.length) return

      const results = await Promise.all(
        toFetch.map(async ({ key, type, id }) => {
          try {
            const endpoint = type === "EBOOK"
              ? `/api/ebooks/${encodeURIComponent(id)}`
              : `/api/courses/${encodeURIComponent(id)}`
            const res = await fetch(endpoint, { cache: "no-store" })
            const json: any = await res.json().catch(() => ({}))
            const cover = json?.data?.coverImageUrl || json?.data?.imageUrl || json?.data?.thumbnailUrl || ""
            return [key, cover] as const
          } catch {
            return [key, ""] as const
          }
        })
      )

      if (!cancelled && results.length) {
        setItemAssets((prev) => {
          const next = { ...prev }
          for (const [key, cover] of results) {
            if (next[key] === undefined) {
              next[key] = cover || ""
            }
          }
          return next
        })
      }
    }

    loadAssets()
    return () => { cancelled = true }
  }, [orders, itemAssets])

  const orderStatusText = (status?: string, paymentStatus?: string) => {
    const s = (status || "").toUpperCase()
    const ps = (paymentStatus || "").toUpperCase()
    if (s === "CANCELLED") return "ยกเลิก"
    if (s === "REJECTED") return "ปฏิเสธ"
    // Prefer payment status when present
    if (ps === "COMPLETED") return "ชำระเงินแล้ว"
    if (ps === "PENDING_VERIFICATION") return "รอตรวจสอบสลิป"
    if (s === "COMPLETED") return "ชำระเงินแล้ว"
    if (s === "PENDING_VERIFICATION") return "รอตรวจสอบสลิป"
    if (s === "PENDING") return "รอการชำระ"
    return status || "-"
  }

  const slipStatusText = (paymentStatus?: string) => {
    const ps = (paymentStatus || "").toUpperCase()
    if (ps === "COMPLETED") return "ชำระแล้ว"
    if (ps === "PENDING_VERIFICATION") return "รอตรวจสอบ"
    if (ps === "REJECTED") return "ปฏิเสธ"
    if (ps === "PENDING") return "รอการชำระ"
    return "ยังไม่ได้อัพโหลด/รอชำระ"
  }

  const itemTypeLabel = (itemType?: string) => {
    const t = (itemType || "").toUpperCase()
    if (t === "COURSE") return "คอร์สเรียน"
    if (t === "EBOOK") return "E-Book"
    return "สินค้า"
  }

 
  const statusTone = (status?: string, paymentStatus?: string) => {
    const s = (status || "").toUpperCase()
    const ps = (paymentStatus || "").toUpperCase()
    if (s === "CANCELLED" || s === "REJECTED") return "bg-red-50 text-red-700 border border-red-200"
    if (ps === "COMPLETED") return "bg-green-50 text-green-700 border border-green-200"
    if (ps === "PENDING_VERIFICATION") return "bg-blue-50 text-blue-700 border border-blue-200"
    if (s === "COMPLETED") return "bg-green-50 text-green-700 border border-green-200"
    if (s === "PENDING_VERIFICATION") return "bg-blue-50 text-blue-700 border border-blue-200"
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border border-amber-200"
    return "bg-gray-100 text-gray-700 border border-gray-200"
  }

  const onOpenUpload = (order: Order) => {
    setSelectedOrder(order)
    setFile(null)
    setUploadError(null)
    setUploadSuccess(null)
    setOpenUpload(true)
  }

  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const handleUpload = async () => {
    if (!selectedOrder || !file) return
    try {
      setUploading(true)
      setUploadError(null)
      setUploadSuccess(null)
      setUploadProgress(0)
      const form = new FormData()
      form.append("orderId", selectedOrder.id)
      form.append("file", file)
      const res = await http.post(`/api/payments/upload-slip`, form, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded * 100) / evt.total)
            setUploadProgress(pct)
          }
        },
      })
      const json = res.data || {}
      if ((res.status < 200 || res.status >= 300) || json?.success === false) throw new Error(json?.error || "อัพโหลดไม่สำเร็จ")
      setUploadSuccess("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ")
      toast({ title: "อัพโหลดสลิปสำเร็จ", description: "กำลังรอตรวจสอบ" })
      try {
        const r = await http.get(`/api/orders`, { params: { userId: user!.id } })
        const j: OrdersResponse = r.data || { success: false, data: [] }
        if ((r.status >= 200 && r.status < 300) && j.success !== false) setOrders(j.data || [])
      } catch { }
    } catch (e: any) {
      setUploadError(e?.message ?? "อัพโหลดไม่สำเร็จ")
      toast({ title: "อัพโหลดสลิปไม่สำเร็จ", description: e?.message ?? "ลองใหม่อีกครั้ง", variant: "destructive" as any })
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
              <CardContent className="p-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
                  {/* รูป: COURSE (16:9) / EBOOK (3:4) — ใช้ 3:4 เป็น default ในช่วงโหลดเพื่อสมดุลบนมือถือ */}
                  <div className="relative w-full sm:w-auto aspect-[3/4] rounded-md bg-gray-100 ring-1 ring-black/5 overflow-hidden">
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
            const statusLabel = orderStatusText(o.status, o.payment?.status)
            const orderState = (o.status || "").toUpperCase()
            const payState = (o.payment?.status || "").toUpperCase()
            const isCancelled = ["CANCELLED", "REJECTED"].includes(orderState)
            const effectiveState = payState || orderState
            const needsSlipUpload = !isCancelled && ["PENDING", "PENDING_VERIFICATION"].includes(effectiveState)
            const isPaid = !isCancelled && effectiveState === "COMPLETED"
            const payStatus = o.payment?.status
            const displayId = o.orderNumber || o.id
            const createdAt = o.createdAt ? new Date(o.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : ""

            const rawItems = Array.isArray(o.items) ? o.items.filter(Boolean) : []
            const fallbackItems: NonNullable<Order["items"]> = []
            if (!rawItems.length) {
              if (o.course || (o as any).courseId) {
                fallbackItems.push({
                  itemType: "COURSE",
                  itemId: (o as any).courseId,
                  title: o.course?.title,
                  quantity: 1,
                  totalPrice: o.total,
                  unitPrice: o.total,
                })
              }
              if (o.ebook || (o as any).ebookId) {
                fallbackItems.push({
                  itemType: "EBOOK",
                  itemId: (o as any).ebookId,
                  title: o.ebook?.title,
                  quantity: 1,
                  totalPrice: o.total,
                  unitPrice: o.total,
                })
              }
            }
            const items = (rawItems.length ? rawItems : fallbackItems).map((item, idx) => ({
              ...item,
              _key: item.id || `${item.itemType || o.orderType}-${item.itemId || idx}`,
            }))

            return (
              <Card key={o.id} className="shadow-sm">
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold text-gray-900">คำสั่งซื้อ #{displayId}</div>
                        <Badge className={`whitespace-nowrap ${statusTone(o.status, o.payment?.status)}`}>{statusLabel}</Badge>
                      </div>
                      {createdAt && <div className="text-xs text-gray-500">สั่งซื้อเมื่อ {createdAt}</div>}
                      <div className="text-sm text-gray-700">ยอดรวม {formatCurrency(o.total)} บาท</div>
                      <div className="text-xs text-gray-500">สถานะตรวจสลิป: {slipStatusText(payStatus)}</div>
                      {o.payment?.ref && (
                        <div className="text-xs text-gray-500">เลขอ้างอิง: {o.payment.ref}</div>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
                      <Link href={`/order-success/${o.id}`} className="w-full md:w-auto">
                        <Button variant="outline" className="w-full md:w-[7.5rem]">
                          ดูรายละเอียด
                        </Button>
                      </Link>

                      {needsSlipUpload ? (
                        <Button
                          onClick={() => onOpenUpload(o)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white w-full md:w-[7.5rem]"
                        >
                          อัพโหลดสลิป
                        </Button>
                      ) : isPaid ? (
                        <Badge className="bg-green-600 text-white w-full md:w-auto justify-center">ชำระเงินแล้ว</Badge>
                      ) : (
                        <Badge className={`${statusTone(o.status, o.payment?.status)} w-full md:w-auto justify-center`}>{statusLabel}</Badge>
                      )}
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="space-y-3 border-t border-amber-100/60 pt-3">
                      {items.map((item, idx) => {
                        const type = String(item.itemType || o.orderType || "")
                        const resolvedType = type.toUpperCase()
                        const itemId = item.itemId || (resolvedType === "COURSE" ? (o as any).courseId : (o as any).ebookId) || ""
                        const assetKey = `${resolvedType}:${itemId}`
                        const cover = (itemId && itemAssets[assetKey])
                          || (resolvedType === "COURSE" ? o.course?.coverImageUrl : o.ebook?.coverImageUrl)
                          || "/placeholder.svg"
                        const aspectClass = resolvedType === "EBOOK" ? "aspect-[3/4]" : "aspect-video"
                        const quantity = Number(item.quantity ?? 1)
                        const totalPrice = Number(item.totalPrice ?? (item.unitPrice ?? 0) * quantity)
                        const unitPrice = quantity > 0 ? Number(item.unitPrice ?? totalPrice / quantity) : Number(item.unitPrice ?? 0)
                        const title = item.title || (resolvedType === "COURSE" ? o.course?.title : o.ebook?.title) || itemTypeLabel(resolvedType)

                        const sizeClass = resolvedType === "EBOOK"
                          ? "w-24 sm:w-32 md:w-36"
                          : "w-28 sm:w-40 md:w-48"

                        return (
                          <div
                            key={`${item._key}-${idx}`}
                            className="flex flex-col gap-3 rounded-lg border bg-white/80 p-3 sm:grid sm:grid-cols-[auto,1fr,auto] sm:items-center sm:gap-4 md:gap-6"
                          >
                            <div
                              className={`relative ${sizeClass} ${aspectClass} overflow-hidden rounded-md bg-gray-100 ring-1 ring-black/5 mx-auto sm:mx-0`}
                            >
                              <Image
                                src={cover}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 480px) 30vw, (max-width: 1024px) 25vw, 12rem"
                              />
                            </div>
                            <div className="min-w-0 space-y-1 sm:order-2 sm:min-w-[18rem]">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-medium text-gray-900 line-clamp-2">{title}</div>
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                  {itemTypeLabel(resolvedType)}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                จำนวน: {quantity} {quantity > 1 ? "ชิ้น" : "รายการ"}
                              </div>
                              <div className="text-xs text-gray-500">
                                ราคาต่อหน่วย: {formatCurrency(unitPrice)}
                              </div>
                            </div>
                            <div className="text-right text-sm font-semibold text-gray-900 self-end sm:order-3 sm:self-center">
                              {formatCurrency(totalPrice)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
                {uploading ? `กำลังอัพโหลด ${uploadProgress}%` : "อัพโหลด"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
