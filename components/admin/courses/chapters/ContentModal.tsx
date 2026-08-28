"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminContent } from "./types"

const TYPE_OPTIONS: { value: AdminContent["contentType"]; label: string }[] = [
  { value: "VIDEO", label: "วิดีโอ" },
  { value: "PDF", label: "เอกสาร PDF" },
  { value: "LINK", label: "ลิงก์ภายนอก" },
  { value: "QUIZ", label: "แบบทดสอบ" },
  { value: "ASSIGNMENT", label: "การบ้าน/งานที่มอบหมาย" },
]

export default function ContentModal({
  open,
  editing,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminContent | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; contentType: AdminContent["contentType"]; contentUrl: string }) => void
}) {
  const [title, setTitle] = useState("")
  const [contentType, setContentType] = useState<AdminContent["contentType"]>("VIDEO")
  const [contentUrl, setContentUrl] = useState("")

  useEffect(() => {
    if (!open) return
    setTitle(editing?.title ?? "")
    setContentType(editing?.contentType ?? "VIDEO")
    setContentUrl(editing?.contentUrl ?? "")
  }, [open, editing])

  const urlLabel = contentType === "VIDEO" ? "URL วิดีโอ (YouTube/Vimeo)" : contentType === "PDF" ? "URL ไฟล์ PDF" : "URL"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขเนื้อหา" : "เพิ่มเนื้อหาใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>ชื่อเนื้อหา</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น บทนำ: แรงและการเคลื่อนที่" />
          </div>

          <div className="space-y-2">
            <Label>ประเภท</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as AdminContent["contentType"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{urlLabel}</Label>
            <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => onSubmit({ title, contentType, contentUrl })}
            disabled={submitting || !title.trim() || !contentUrl.trim()}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
