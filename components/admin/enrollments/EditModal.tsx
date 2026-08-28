"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminEnrollment } from "@/hooks/admin/useEnrollments"

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "กำลังเรียน" },
  { value: "COMPLETED", label: "เรียนจบแล้ว" },
  { value: "CANCELED", label: "ยกเลิก" },
]

export default function EditModal({
  open,
  enrollment,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  enrollment: AdminEnrollment | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { status: string; accessDuration: string; accessHours: string }) => void
}) {
  const [status, setStatus] = useState("ACTIVE")
  const [accessDuration, setAccessDuration] = useState("")
  const [accessHours, setAccessHours] = useState("")

  useEffect(() => {
    if (!enrollment) return
    setStatus(enrollment.status)
    setAccessDuration(enrollment.accessDuration != null ? String(enrollment.accessDuration) : "")
    setAccessHours(enrollment.accessHours != null ? String(enrollment.accessHours) : "")
  }, [enrollment])

  if (!enrollment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>แก้ไขการลงทะเบียน</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-semibold">ผู้เรียน: </span>
              {enrollment.user?.name || enrollment.user?.email}
            </div>
            <div>
              <span className="font-semibold">คอร์ส: </span>
              {enrollment.course?.title}
            </div>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>อายุการเข้าถึง (วัน)</Label>
              <Input
                type="number"
                min={0}
                placeholder={`ค่าเริ่มต้นของคอร์ส (${enrollment.course?.accessDuration ?? "-"})`}
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ชั่วโมงเรียน (override)</Label>
              <Input
                type="number"
                min={0}
                value={accessHours}
                onChange={(e) => setAccessHours(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของคอร์ส</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={() => onSubmit({ status, accessDuration, accessHours })} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
