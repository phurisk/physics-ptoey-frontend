"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectOptions } from "@/lib/constants"
import type { AdminMockTopic } from "@/hooks/admin/useMockTopics"

export default function MockTopicModal({
  open,
  editing,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminMockTopic | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { subject: string; name: string }) => void
}) {
  const [subject, setSubject] = useState("")
  const [name, setName] = useState("")
  const subjectOptions = getSubjectOptions()

  useEffect(() => {
    if (!open) return
    setSubject(editing?.subject ?? "")
    setName(editing?.name ?? "")
  }, [open, editing])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขหัวข้อ" : "เพิ่มหัวข้อใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>วิชา</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกวิชา" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ชื่อหัวข้อ</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น กลศาสตร์" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={() => onSubmit({ subject, name })} disabled={submitting || !subject || !name.trim()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
