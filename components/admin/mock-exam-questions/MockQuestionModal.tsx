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
import { getQuestionTypeOptions } from "@/lib/constants"
import type { AdminMockQuestion, AdminMockQuestionOption } from "@/hooks/admin/useMockExamQuestions"
import type { AdminMockTopic } from "@/hooks/admin/useMockTopics"

const TYPE_OPTIONS = getQuestionTypeOptions()

function emptyOptions(n: number): AdminMockQuestionOption[] {
  return Array.from({ length: n }, (_, i) => ({ optionText: "", isCorrect: false, order: i }))
}

export default function MockQuestionModal({
  open,
  editing,
  topics,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminMockQuestion | null
  topics: AdminMockTopic[]
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] = useState<AdminMockQuestion["questionType"]>("MULTIPLE_CHOICE")
  const [topicId, setTopicId] = useState("")
  const [marks, setMarks] = useState("1")
  const [explanation, setExplanation] = useState("")
  const [options, setOptions] = useState<AdminMockQuestionOption[]>(emptyOptions(2))
  const [correctAnswerText, setCorrectAnswerText] = useState("")
  const [numericTolerance, setNumericTolerance] = useState("")

  useEffect(() => {
    if (!open) return
    if (editing) {
      setQuestionText(editing.questionText)
      setQuestionType(editing.questionType)
      setTopicId(editing.topicId || "")
      setMarks(String(editing.marks))
      setExplanation(editing.explanation || "")
      setNumericTolerance(editing.numericTolerance != null ? String(editing.numericTolerance) : "")
      if (editing.questionType === "SHORT_ANSWER") {
        setCorrectAnswerText(editing.options[0]?.optionText || "")
        setOptions([])
      } else {
        setOptions(editing.options.length ? editing.options : emptyOptions(2))
        setCorrectAnswerText("")
      }
    } else {
      setQuestionText("")
      setQuestionType("MULTIPLE_CHOICE")
      setTopicId("")
      setMarks("1")
      setExplanation("")
      setOptions(emptyOptions(2))
      setCorrectAnswerText("")
      setNumericTolerance("")
    }
  }, [open, editing])

  const handleTypeChange = (value: string) => {
    const type = value as AdminMockQuestion["questionType"]
    setQuestionType(type)
    if (type === "TRUE_FALSE") {
      setOptions([
        { optionText: "จริง", isCorrect: false, order: 0 },
        { optionText: "เท็จ", isCorrect: false, order: 1 },
      ])
    } else if (type === "MULTIPLE_CHOICE") {
      setOptions(emptyOptions(2))
    }
  }

  const updateOption = (idx: number, patch: Partial<AdminMockQuestionOption>) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)))
  }

  const addOption = () => setOptions((prev) => [...prev, { optionText: "", isCorrect: false, order: prev.length }])
  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx))

  const isMcOrTf = questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE"
  const isValid =
    questionText.trim() &&
    (isMcOrTf ? options.length >= 2 && options.some((o) => o.isCorrect) && options.every((o) => o.optionText.trim()) : correctAnswerText.trim())

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {
      questionText,
      questionType,
      topicId: topicId || null,
      marks,
      explanation: explanation || null,
      explanationImages: editing?.explanationImages || [],
      options: isMcOrTf ? options.map((o, idx) => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: idx })) : [{ optionText: correctAnswerText, isCorrect: true, order: 0 }],
    }
    if (questionType === "SHORT_ANSWER") {
      payload.numericTolerance = numericTolerance || null
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>คำถาม</Label>
            <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ประเภทคำถาม</Label>
              <Select value={questionType} onValueChange={handleTypeChange}>
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
              <Label>คะแนน</Label>
              <Input type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>หัวข้อ (ไม่บังคับ)</Label>
            <Select value={topicId || "__none"} onValueChange={(v) => setTopicId(v === "__none" ? "" : v)}>
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

          {isMcOrTf ? (
            <div className="space-y-2 rounded-lg border border-gray-100 p-3">
              <Label>ตัวเลือก (เลือกคำตอบที่ถูกต้อง)</Label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Switch checked={opt.isCorrect} onCheckedChange={(v) => updateOption(idx, { isCorrect: v })} />
                  <Input
                    value={opt.optionText}
                    onChange={(e) => updateOption(idx, { optionText: e.target.value })}
                    placeholder={`ตัวเลือกที่ ${idx + 1}`}
                    disabled={questionType === "TRUE_FALSE"}
                  />
                  {questionType === "MULTIPLE_CHOICE" && options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {questionType === "MULTIPLE_CHOICE" && options.length < 6 && (
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  เพิ่มตัวเลือก
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-100 p-3">
              <div className="space-y-2">
                <Label>คำตอบที่ถูกต้อง</Label>
                <Input value={correctAnswerText} onChange={(e) => setCorrectAnswerText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ค่าความคลาดเคลื่อนที่ยอมรับได้ (ตัวเลข, ว่าง = ต้องตรงเป๊ะ)</Label>
                <Input type="number" step="any" value={numericTolerance} onChange={(e) => setNumericTolerance(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>คำอธิบายเฉลย (ไม่บังคับ)</Label>
            <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} />
          </div>
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
