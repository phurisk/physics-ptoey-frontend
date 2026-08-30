"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Plus, X, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getQuestionTypeOptions } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import type { AdminMockQuestion, AdminMockQuestionOption } from "@/hooks/admin/useMockExamQuestions"
import type { AdminMockTopic } from "@/hooks/admin/useMockTopics"

async function uploadImage(file: File, type: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", type)
  const res = await fetch("/api/upload-blob", { method: "POST", body: formData })
  const result = await res.json()
  if (!result.success) throw new Error(result.error || "Upload failed")
  return result.data.url
}

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
  const [questionImage, setQuestionImage] = useState("")
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false)
  const [explanationImages, setExplanationImages] = useState<string[]>([])
  const [uploadingExplanationImage, setUploadingExplanationImage] = useState(false)
  const { toast } = useToast()
  const questionImageInputRef = useRef<HTMLInputElement>(null)
  const explanationImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setQuestionText(editing.questionText)
      setQuestionType(editing.questionType)
      setTopicId(editing.topicId || "")
      setMarks(String(editing.marks))
      setExplanation(editing.explanation || "")
      setNumericTolerance(editing.numericTolerance != null ? String(editing.numericTolerance) : "")
      setQuestionImage(editing.questionImage || "")
      setExplanationImages(editing.explanationImages || [])
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
      setQuestionImage("")
      setExplanationImages([])
    }
  }, [open, editing])

  const handleQuestionImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingQuestionImage(true)
    try {
      const url = await uploadImage(file, "mock-question-image")
      setQuestionImage(url)
      toast({ title: "อัพโหลดรูปภาพสำเร็จ" })
    } catch (error) {
      toast({ variant: "destructive", title: `อัพโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : ""}` })
    } finally {
      setUploadingQuestionImage(false)
    }
  }

  const handleExplanationImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingExplanationImage(true)
    try {
      const url = await uploadImage(file, "mock-explanation-image")
      setExplanationImages((prev) => [...prev, url])
      toast({ title: "อัพโหลดรูปเฉลยสำเร็จ" })
    } catch (error) {
      toast({ variant: "destructive", title: `อัพโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : ""}` })
    } finally {
      setUploadingExplanationImage(false)
    }
  }

  const removeExplanationImage = (url: string) => setExplanationImages((prev) => prev.filter((u) => u !== url))

  const [uploadingOptionIdx, setUploadingOptionIdx] = useState<number | null>(null)
  const optionImageInputRef = useRef<HTMLInputElement>(null)
  const pendingOptionIdxRef = useRef<number | null>(null)

  const handleOptionImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const idx = pendingOptionIdxRef.current
    e.target.value = ""
    if (!file || idx == null) return
    setUploadingOptionIdx(idx)
    try {
      const url = await uploadImage(file, "mock-option-image")
      setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, optionImage: url } : o)))
    } catch (error) {
      toast({ variant: "destructive", title: `อัพโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : ""}` })
    } finally {
      setUploadingOptionIdx(null)
    }
  }

  const triggerOptionImageUpload = (idx: number) => {
    pendingOptionIdxRef.current = idx
    optionImageInputRef.current?.click()
  }

  const removeOptionImage = (idx: number) => setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, optionImage: null } : o)))

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
      questionImage: questionImage || null,
      explanationImages,
      options: isMcOrTf
        ? options.map((o, idx) => ({ optionText: o.optionText, optionImage: o.optionImage || null, isCorrect: o.isCorrect, order: idx }))
        : [{ optionText: correctAnswerText, isCorrect: true, order: 0 }],
    }
    if (questionType === "SHORT_ANSWER") {
      payload.numericTolerance = numericTolerance || null
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{editing ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label>คำถาม</Label>
            <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>รูปประกอบคำถาม (ไม่บังคับ — สำหรับสมการ/แผนภาพที่พิมพ์ยาก)</Label>
            <div className="flex items-center gap-3">
              {questionImage && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={questionImage} alt="Question" className="h-20 w-28 rounded-md border object-cover" />
                  <button
                    type="button"
                    onClick={() => setQuestionImage("")}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <input ref={questionImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleQuestionImageChange} />
              <Button type="button" variant="outline" size="sm" disabled={uploadingQuestionImage} onClick={() => questionImageInputRef.current?.click()}>
                {uploadingQuestionImage ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                {questionImage ? "เปลี่ยนรูป" : "อัพโหลดรูป"}
              </Button>
            </div>
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
              <input ref={optionImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleOptionImageChange} />
              {options.map((opt, idx) => (
                <div key={idx} className="space-y-1.5 rounded-md border border-gray-100 p-2">
                  <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2 pl-9">
                    {opt.optionImage ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opt.optionImage} alt="" className="h-14 w-20 rounded-md border object-cover" />
                        <button
                          type="button"
                          onClick={() => removeOptionImage(idx)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingOptionIdx === idx}
                        onClick={() => triggerOptionImageUpload(idx)}
                      >
                        {uploadingOptionIdx === idx ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        แนบรูปตัวเลือก
                      </Button>
                    )}
                  </div>
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

          <div className="space-y-2">
            <Label>รูปเฉลยแบบละเอียด (ไม่บังคับ — แนบได้หลายรูป รองรับ GIF เคลื่อนไหว)</Label>
            {explanationImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {explanationImages.map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Explanation" className="h-16 w-16 rounded-md border object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExplanationImage(url)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {explanationImages.length < 5 && (
              <>
                <input ref={explanationImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleExplanationImageChange} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingExplanationImage}
                  onClick={() => explanationImageInputRef.current?.click()}
                >
                  {uploadingExplanationImage ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                  แนบรูปเฉลย ({explanationImages.length}/5)
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
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
