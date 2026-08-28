"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminFlashcard, AdminFlashcardOption } from "@/hooks/admin/useFlashcards"

const MODE_OPTIONS = [
  { value: "SELF_GRADE", label: "ให้คะแนนตัวเอง (พลิกดูเฉลย)" },
  { value: "MULTIPLE_CHOICE", label: "ปรนัย (เลือกตอบ)" },
  { value: "TYPED", label: "พิมพ์คำตอบ" },
]

export default function CardModal({
  open,
  editing,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminFlashcard | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [front, setFront] = useState("")
  const [back, setBack] = useState("")
  const [hint, setHint] = useState("")
  const [answerMode, setAnswerMode] = useState<AdminFlashcard["answerMode"]>("SELF_GRADE")
  const [options, setOptions] = useState<AdminFlashcardOption[]>([
    { optionText: "", isCorrect: false, order: 0 },
    { optionText: "", isCorrect: false, order: 1 },
  ])
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>([""])
  const [numericTolerance, setNumericTolerance] = useState("")

  useEffect(() => {
    if (!open) return
    if (editing) {
      setFront(editing.front)
      setBack(editing.back)
      setHint(editing.hint || "")
      setAnswerMode(editing.answerMode)
      setOptions(editing.options.length ? editing.options : [{ optionText: "", isCorrect: false, order: 0 }, { optionText: "", isCorrect: false, order: 1 }])
      setAcceptedAnswers(editing.acceptedAnswers.length ? editing.acceptedAnswers : [""])
      setNumericTolerance(editing.numericTolerance != null ? String(editing.numericTolerance) : "")
    } else {
      setFront("")
      setBack("")
      setHint("")
      setAnswerMode("SELF_GRADE")
      setOptions([
        { optionText: "", isCorrect: false, order: 0 },
        { optionText: "", isCorrect: false, order: 1 },
      ])
      setAcceptedAnswers([""])
      setNumericTolerance("")
    }
  }, [open, editing])

  const updateOption = (idx: number, patch: Partial<AdminFlashcardOption>) => setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)))
  const addOption = () => setOptions((prev) => [...prev, { optionText: "", isCorrect: false, order: prev.length }])
  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx))

  const updateAcceptedAnswer = (idx: number, value: string) => setAcceptedAnswers((prev) => prev.map((a, i) => (i === idx ? value : a)))
  const addAcceptedAnswer = () => setAcceptedAnswers((prev) => [...prev, ""])
  const removeAcceptedAnswer = (idx: number) => setAcceptedAnswers((prev) => prev.filter((_, i) => i !== idx))

  const isValid =
    front.trim() &&
    back.trim() &&
    (answerMode === "SELF_GRADE" ||
      (answerMode === "MULTIPLE_CHOICE" && options.length >= 2 && options.some((o) => o.isCorrect) && options.every((o) => o.optionText.trim())) ||
      (answerMode === "TYPED" && acceptedAnswers.some((a) => a.trim())))

  const handleSubmit = () => {
    onSubmit({
      front,
      back,
      hint: hint || null,
      answerMode,
      options: answerMode === "MULTIPLE_CHOICE" ? options.map((o, idx) => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: idx })) : [],
      acceptedAnswers: answerMode === "TYPED" ? acceptedAnswers.filter((a) => a.trim()) : [],
      numericTolerance: answerMode === "TYPED" ? numericTolerance || null : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขการ์ด" : "เพิ่มการ์ดใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>หน้า (คำถาม)</Label>
            <Textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>หลัง (คำตอบ/คำอธิบาย)</Label>
            <Textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>คำใบ้ (ไม่บังคับ)</Label>
            <Input value={hint} onChange={(e) => setHint(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>รูปแบบคำตอบ</Label>
            <Select value={answerMode} onValueChange={(v) => setAnswerMode(v as AdminFlashcard["answerMode"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {answerMode === "MULTIPLE_CHOICE" && (
            <div className="space-y-2 rounded-lg border border-gray-100 p-3">
              <Label>ตัวเลือก (เลือกคำตอบที่ถูกต้อง)</Label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Switch checked={opt.isCorrect} onCheckedChange={(v) => updateOption(idx, { isCorrect: v })} />
                  <Input value={opt.optionText} onChange={(e) => updateOption(idx, { optionText: e.target.value })} placeholder={`ตัวเลือกที่ ${idx + 1}`} />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  เพิ่มตัวเลือก
                </Button>
              )}
            </div>
          )}

          {answerMode === "TYPED" && (
            <div className="space-y-3 rounded-lg border border-gray-100 p-3">
              <Label>คำตอบที่ยอมรับได้ (พิมพ์ได้หลายแบบ เช่น คำสะกดต่างกัน)</Label>
              {acceptedAnswers.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={a} onChange={(e) => updateAcceptedAnswer(idx, e.target.value)} placeholder={`คำตอบที่ยอมรับ ${idx + 1}`} />
                  {acceptedAnswers.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeAcceptedAnswer(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAcceptedAnswer}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                เพิ่มคำตอบ
              </Button>
              <div className="space-y-2">
                <Label>ค่าความคลาดเคลื่อนตัวเลข (ไม่บังคับ, ว่าง = ต้องตรงเป๊ะ)</Label>
                <Input type="number" step="any" value={numericTolerance} onChange={(e) => setNumericTolerance(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
