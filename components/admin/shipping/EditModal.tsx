"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminShipping } from "@/hooks/admin/useShipping"

const METHOD_OPTIONS = ["STANDARD", "EXPRESS", "KERRY", "THAILAND_POST", "JT_EXPRESS", "FLASH_EXPRESS", "NINJA_VAN", "DHL", "FEDEX"]
const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "PROCESSING", label: "กำลังเตรียมจัดส่ง" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "IN_TRANSIT", label: "อยู่ระหว่างขนส่ง" },
  { value: "OUT_FOR_DELIVERY", label: "กำลังนำส่ง" },
  { value: "DELIVERED", label: "จัดส่งสำเร็จ" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "RETURNED", label: "ตีกลับ" },
]

export default function EditModal({
  open,
  shipping,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  shipping: AdminShipping | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { status: string; shippingMethod: string; trackingNumber: string }) => void
}) {
  const [status, setStatus] = useState("PENDING")
  const [shippingMethod, setShippingMethod] = useState("STANDARD")
  const [trackingNumber, setTrackingNumber] = useState("")

  useEffect(() => {
    if (!shipping) return
    setStatus(shipping.status)
    setShippingMethod(shipping.shippingMethod)
    setTrackingNumber(shipping.trackingNumber || "")
  }, [shipping])

  if (!shipping) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลการจัดส่ง</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-semibold">ผู้รับ: </span>
              {shipping.name} ({shipping.phone})
            </div>
            <div className="text-gray-500">
              {shipping.address}, {shipping.district}, {shipping.province} {shipping.postalCode}
            </div>
          </div>

          <div className="space-y-2">
            <Label>ขนส่ง</Label>
            <Select value={shippingMethod} onValueChange={setShippingMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>เลขพัสดุ</Label>
            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="เลขติดตามพัสดุ" />
          </div>

          <div className="space-y-2">
            <Label>สถานะ</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={() => onSubmit({ status, shippingMethod, trackingNumber })} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
