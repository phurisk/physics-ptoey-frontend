"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { AdminChapter } from "./types"

export default function ChapterModal({
  open,
  editing,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminChapter | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (title: string) => void
}) {
  const [title, setTitle] = useState("")

  useEffect(() => {
    if (open) setTitle(editing?.title ?? "")
  }, [open, editing])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขบทเรียน" : "เพิ่มบทเรียนใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>ชื่อบทเรียน</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น บทที่ 1: กลศาสตร์เบื้องต้น" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={() => onSubmit(title)} disabled={submitting || !title.trim()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
