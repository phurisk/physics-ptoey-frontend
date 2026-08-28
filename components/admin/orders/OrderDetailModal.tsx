"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Eye,
  Loader2,
  User as UserIcon,
  School,
  Mail,
  BookOpen,
  Book,
  FileText,
  Landmark,
  Truck,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { AdminOrder } from "@/hooks/admin/useOrders"

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "รอชำระเงิน",
  PENDING_PAYMENT: "รอชำระเงิน",
  PENDING_VERIFICATION: "รอตรวจสอบ",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
  REFUNDED: "คืนเงิน",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "รอชำระ",
  PENDING_VERIFICATION: "รอตรวจสอบ",
  COMPLETED: "ชำระแล้ว",
  REJECTED: "ปฏิเสธ",
  FAILED: "ล้มเหลว",
  REFUNDED: "คืนเงิน",
}

const SHIPPING_STATUS_OPTIONS = [
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "PROCESSING", label: "กำลังจัดเตรียม" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "IN_TRANSIT", label: "อยู่ระหว่างขนส่ง" },
  { value: "OUT_FOR_DELIVERY", label: "กำลังนำส่ง" },
  { value: "DELIVERED", label: "ส่งถึงแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "RETURNED", label: "ตีกลับ" },
]

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount || 0)

const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleString("th-TH") : "-")

export default function OrderDetailModal({
  open,
  orderId,
  onOpenChange,
  onActionSuccess,
}: {
  open: boolean
  orderId: string | null
  onOpenChange: (open: boolean) => void
  onActionSuccess: () => void
}) {
  const { toast } = useToast()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(false)

  const [confirmAction, setConfirmAction] = useState<"APPROVE_PAYMENT" | "REJECT_PAYMENT" | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const [shippingStatus, setShippingStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [shippingSaving, setShippingSaving] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ")
      const detail = data.data as AdminOrder
      setOrder(detail)
      setShippingStatus(detail.shipping?.status || "PENDING")
      setTrackingNumber(detail.shipping?.trackingNumber || "")
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }, [orderId, onOpenChange, toast])

  useEffect(() => {
    if (open && orderId) {
      fetchDetail()
    }
    if (!open) {
      setOrder(null)
      setConfirmAction(null)
      setRejectReason("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId])

  const runAction = async (action: "APPROVE_PAYMENT" | "REJECT_PAYMENT", notes?: string) => {
    if (!order) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "เกิดข้อผิดพลาด")
      toast({ title: data.message })
      setOrder(data.data as AdminOrder)
      onActionSuccess()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" })
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
      setRejectReason("")
    }
  }

  const saveShipping = async () => {
    if (!order) return
    setShippingSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_SHIPPING", shippingStatus, trackingNumber }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "เกิดข้อผิดพลาด")
      toast({ title: data.message })
      setOrder(data.data as AdminOrder)
      onActionSuccess()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เกิดข้อผิดพลาด" })
    } finally {
      setShippingSaving(false)
    }
  }

  const canReview = order?.payment && order.payment.status !== "COMPLETED" && order.payment.status !== "REJECTED"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              รายละเอียดคำสั่งซื้อ {order ? `#${order.orderNumber}` : ""}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !order ? (
            <div className="py-10 text-center text-sm text-gray-400">ไม่สามารถโหลดข้อมูลได้</div>
          ) : (
            <div className="space-y-5">
              {/* Status summary */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">สถานะคำสั่งซื้อ: {ORDER_STATUS_LABELS[order.status] || order.status}</Badge>
                {order.payment && (
                  <Badge variant="outline">สถานะการชำระเงิน: {PAYMENT_STATUS_LABELS[order.payment.status] || order.payment.status}</Badge>
                )}
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" /> สั่งซื้อเมื่อ {formatDate(order.createdAt)}
                </span>
              </div>

              {/* Customer */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  ข้อมูลลูกค้า
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <UserIcon className="h-3.5 w-3.5 text-gray-400" /> {order.user?.name || "-"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> {order.user?.email || "-"}
                  </div>
                  {order.user?.school && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <School className="h-3.5 w-3.5 text-gray-400" /> {order.user.school}
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  รายการสินค้า
                </div>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${
                            item.itemType === "EBOOK" ? "bg-purple-500" : "bg-blue-500"
                          }`}
                        >
                          {item.itemType === "EBOOK" ? <Book className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-400">
                            {item.itemType === "EBOOK" ? "หนังสือ" : "คอร์ส"} • จำนวน {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">{formatCurrency(item.totalPrice)}</div>
                    </div>
                  ))}
                </div>

                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>ยอดรวมสินค้า</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.couponDiscount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>ส่วนลดคูปอง {order.couponCode ? `(${order.couponCode})` : ""}</span>
                      <span>-{formatCurrency(order.couponDiscount)}</span>
                    </div>
                  )}
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>ค่าจัดส่ง</span>
                      <span>{formatCurrency(order.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold text-gray-900">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Landmark className="h-4 w-4 text-blue-600" />
                  ข้อมูลการชำระเงิน
                </div>

                {order.payment ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">วิธีการชำระ</div>
                        <div className="text-sm text-gray-700">{order.payment.method}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500">จำนวนเงิน</div>
                        <div className="text-sm font-semibold text-emerald-600">{formatCurrency(order.payment.amount)}</div>
                      </div>
                      {order.payment.ref && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">เลขอ้างอิง</div>
                          <div className="font-mono text-sm text-gray-700">{order.payment.ref}</div>
                        </div>
                      )}
                      {order.payment.uploadedAt && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">วันที่อัปโหลดสลิป</div>
                          <div className="text-sm text-gray-700">{formatDate(order.payment.uploadedAt)}</div>
                        </div>
                      )}
                      {order.payment.verifiedAt && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">วันที่ตรวจสอบ</div>
                          <div className="text-sm text-gray-700">{formatDate(order.payment.verifiedAt)}</div>
                        </div>
                      )}
                      {order.payment.confidenceScore != null && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">ความเชื่อมั่นการตรวจสอบอัตโนมัติ</div>
                          <div className="text-sm text-gray-700">{order.payment.confidenceScore}%</div>
                        </div>
                      )}
                    </div>

                    {order.payment.detectedAmount != null && (
                      <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                        <div className="mb-1 font-semibold text-gray-700">ข้อมูลที่ตรวจพบจากสลิป (EasySlip)</div>
                        <div>จำนวนเงิน: {formatCurrency(order.payment.detectedAmount)}</div>
                        {order.payment.detectedDate && <div>วันที่โอน: {formatDate(order.payment.detectedDate)}</div>}
                        {order.payment.detectedSender && <div>ผู้โอน: {order.payment.detectedSender}</div>}
                        {order.payment.detectedReceiver && <div>ผู้รับโอน: {order.payment.detectedReceiver}</div>}
                        {order.payment.analysisError && <div className="text-red-500">ข้อผิดพลาด: {order.payment.analysisError}</div>}
                      </div>
                    )}

                    {order.payment.notes && (
                      <div>
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <FileText className="h-3.5 w-3.5" /> หมายเหตุ
                        </div>
                        <div className="text-sm text-gray-700">{order.payment.notes}</div>
                      </div>
                    )}

                    {order.payment.slipUrl ? (
                      <div className="rounded-lg border border-gray-100 p-3 text-center">
                        <a href={order.payment.slipUrl} target="_blank" rel="noopener noreferrer" className="group relative mx-auto block max-w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.payment.slipUrl}
                            alt="หลักฐานการโอนเงิน"
                            className="mx-auto max-h-[360px] max-w-full rounded-md border border-gray-100 object-contain"
                          />
                        </a>
                        <p className="mt-2 text-xs text-gray-500">คลิกที่รูปเพื่อดูขนาดเต็ม</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-4 text-center text-sm text-orange-700">
                        <AlertTriangle className="mx-auto mb-1 h-5 w-5" />
                        ยังไม่มีหลักฐานการโอนเงิน
                      </div>
                    )}

                    {canReview && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={actionLoading}
                          onClick={() => setConfirmAction("APPROVE_PAYMENT")}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> อนุมัติการชำระเงิน
                        </Button>
                        <Button variant="destructive" disabled={actionLoading} onClick={() => setConfirmAction("REJECT_PAYMENT")}>
                          <XCircle className="mr-1.5 h-4 w-4" /> ปฏิเสธการชำระเงิน
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">ไม่พบข้อมูลการชำระเงิน</div>
                )}
              </div>

              {/* Shipping */}
              {order.shipping && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Truck className="h-4 w-4 text-blue-600" />
                    ข้อมูลการจัดส่ง
                  </div>
                  <div className="mb-3 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs text-gray-500">ผู้รับ</div>
                      {order.shipping.name} ({order.shipping.phone})
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-gray-500">ที่อยู่</div>
                      {order.shipping.address} {order.shipping.district} {order.shipping.province} {order.shipping.postalCode}
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label>สถานะการจัดส่ง</Label>
                      <Select value={shippingStatus} onValueChange={setShippingStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="สถานะการจัดส่ง" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPPING_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>เลขพัสดุ</Label>
                      <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="เลขพัสดุ (ถ้ามี)" />
                    </div>
                    <Button onClick={saveShipping} disabled={shippingSaving}>
                      {shippingSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                      บันทึก
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction === "APPROVE_PAYMENT"} onOpenChange={(next) => !next && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              ยืนยันอนุมัติการชำระเงิน
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-700">
            ระบบจะตั้งสถานะการชำระเงินเป็น &quot;ชำระแล้ว&quot; ตั้งสถานะคำสั่งซื้อเป็น &quot;สำเร็จ&quot; และมอบสิทธิ์การเข้าถึงสินค้าให้ลูกค้าโดยอัตโนมัติ
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={() => runAction("APPROVE_PAYMENT")}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              อนุมัติ
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === "REJECT_PAYMENT"} onOpenChange={(next) => !next && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              ยืนยันปฏิเสธการชำระเงิน
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">ระบุเหตุผลการปฏิเสธ (จะแสดงให้ลูกค้าเห็น)</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น หลักฐานการโอนเงินไม่ถูกต้องหรือไม่ชัดเจน"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>ยกเลิก</AlertDialogCancel>
            <Button variant="destructive" disabled={actionLoading} onClick={() => runAction("REJECT_PAYMENT", rejectReason || undefined)}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              ปฏิเสธ
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
