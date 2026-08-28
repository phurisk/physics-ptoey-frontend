"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function BulkImportModal({
  open,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>นำเข้าการ์ดเป็นชุด</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>วางข้อมูล 1 การ์ดต่อบรรทัด แยกหน้า/หลังด้วย Tab (คัดลอกจาก Excel/Google Sheets ได้โดยตรง)</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="font-mono text-sm"
            placeholder={"กฎข้อที่ 1 ของนิวตันกล่าวว่าอย่างไร\tวัตถุจะรักษาสภาพหยุดนิ่งหรือเคลื่อนที่คงที่...\nหน่วยของแรงคืออะไร\tนิวตัน (N)"}
          />
          <p className="text-xs text-gray-400">รองรับเฉพาะรูปแบบ &quot;ให้คะแนนตัวเอง&quot; เท่านั้น — การ์ดแบบปรนัย/พิมพ์คำตอบ ต้องเพิ่มทีละใบผ่านปุ่ม &quot;เพิ่มการ์ดใหม่&quot;</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={() => onSubmit(text)} disabled={submitting || !text.trim()}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            นำเข้า
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
