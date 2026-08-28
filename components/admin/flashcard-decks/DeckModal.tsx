"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectOptions, getGradeLevelOptions } from "@/lib/constants"
import { fetchMockTopicsForSubject, type AdminMockTopic } from "@/hooks/admin/useMockTopics"
import type { AdminFlashcardDeck } from "@/hooks/admin/useFlashcardDecks"

export default function DeckModal({
  open,
  editing,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminFlashcardDeck | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [topicId, setTopicId] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [topics, setTopics] = useState<AdminMockTopic[]>([])

  useEffect(() => {
    if (!open) return
    setTitle(editing?.title ?? "")
    setDescription(editing?.description ?? "")
    setSubject(editing?.subject ?? "")
    setGradeLevel(editing?.gradeLevel ?? "")
    setTopicId(editing?.topicId ?? "")
    setCoverImageUrl(editing?.coverImageUrl ?? "")
    setIsActive(editing?.isActive ?? true)
  }, [open, editing])

  useEffect(() => {
    if (!subject) {
      setTopics([])
      return
    }
    fetchMockTopicsForSubject(subject).then(setTopics)
  }, [subject])

  const isValid = title.trim() && subject

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขชุดแฟลชการ์ด" : "สร้างชุดแฟลชการ์ดใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>ชื่อชุด</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ฟิสิกส์: กฎการเคลื่อนที่ของนิวตัน" />
          </div>

          <div className="space-y-2">
            <Label>คำอธิบาย</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>วิชา</Label>
              <Select
                value={subject}
                onValueChange={(v) => {
                  setSubject(v)
                  setTopicId("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกวิชา" />
                </SelectTrigger>
                <SelectContent>
                  {getSubjectOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ระดับชั้น (ไม่บังคับ)</Label>
              <Select value={gradeLevel || "__none"} onValueChange={(v) => setGradeLevel(v === "__none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทุกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">ทุกระดับชั้น</SelectItem>
                  {getGradeLevelOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>หัวข้อ (ไม่บังคับ — เลือกวิชาก่อน)</Label>
            <Select value={topicId || "__none"} onValueChange={(v) => setTopicId(v === "__none" ? "" : v)} disabled={!subject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="ไม่ระบุหัวข้อ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">ไม่ระบุหัวข้อ</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>URL รูปปก (ไม่บังคับ)</Label>
            <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex items-center justify-between">
            <Label>เปิดใช้งาน</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => onSubmit({ title, description: description || null, subject, gradeLevel: gradeLevel || null, topicId: topicId || null, coverImageUrl: coverImageUrl || null, isActive })}
            disabled={submitting || !isValid}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
