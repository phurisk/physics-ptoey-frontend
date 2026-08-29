"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Upload, X, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectOptions, getGradeLevelOptions } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import type { AdminMockExam } from "@/hooks/admin/useMockExams"

type FormState = {
  title: string
  description: string
  courseId: string
  subject: string
  gradeLevel: string
  timeLimit: string
  price: string
  discountPrice: string
  passingMarks: string
  attemptsAllowed: string
  allowPracticeMode: boolean
  allowRealMode: boolean
  practiceUnlockCost: string
  isActive: boolean
  examPdfUrl: string
}

const DEFAULT_VALUES: FormState = {
  title: "",
  description: "",
  courseId: "",
  subject: "",
  gradeLevel: "",
  timeLimit: "",
  price: "0",
  discountPrice: "",
  passingMarks: "0",
  attemptsAllowed: "1",
  allowPracticeMode: true,
  allowRealMode: true,
  practiceUnlockCost: "1",
  isActive: true,
  examPdfUrl: "",
}

export default function MockExamModal({
  open,
  editing,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  editing: AdminMockExam | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<FormState>(DEFAULT_VALUES)
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const subjectOptions = getSubjectOptions()
  const gradeLevelOptions = getGradeLevelOptions()

  useEffect(() => {
    if (!open) return
    fetch("/api/admin/courses?pageSize=100")
      .then((r) => r.json())
      .then((data) => {
        const list: { id: string; title: string }[] = data.success ? data.data.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })) : []
        if (editing?.course && !list.some((c) => c.id === editing.course!.id)) {
          list.unshift(editing.course)
        }
        setCourses(list)
      })
      .catch(() => setCourses([]))

    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || "",
        courseId: editing.courseId || "",
        subject: editing.subject,
        gradeLevel: editing.gradeLevel || "",
        timeLimit: editing.timeLimit != null ? String(editing.timeLimit) : "",
        price: String(editing.price ?? 0),
        discountPrice: editing.discountPrice != null ? String(editing.discountPrice) : "",
        passingMarks: String(editing.passingMarks ?? 0),
        attemptsAllowed: String(editing.attemptsAllowed ?? 1),
        allowPracticeMode: editing.allowPracticeMode,
        allowRealMode: editing.allowRealMode,
        practiceUnlockCost: String(editing.practiceUnlockCost ?? 1),
        isActive: editing.isActive,
        examPdfUrl: editing.examPdfUrl || "",
      })
    } else {
      setForm(DEFAULT_VALUES)
    }
  }, [open, editing])

  const isValid = form.title.trim() && form.subject && (form.allowPracticeMode || form.allowRealMode)

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "mock-exam-pdf")
      const res = await fetch("/api/upload-blob", { method: "POST", body: formData })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || "Upload failed")
      setForm((f) => ({ ...f, examPdfUrl: result.data.url }))
      toast({ title: "อัพโหลดไฟล์ PDF สำเร็จ" })
    } catch (error) {
      toast({ variant: "destructive", title: `อัพโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : ""}` })
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleSubmit = () => {
    onSubmit({
      title: form.title,
      description: form.description || null,
      courseId: form.courseId || null,
      subject: form.subject,
      gradeLevel: form.gradeLevel || null,
      timeLimit: form.timeLimit || null,
      price: form.price || 0,
      discountPrice: form.discountPrice || null,
      passingMarks: form.passingMarks || 0,
      attemptsAllowed: form.attemptsAllowed || 1,
      allowPracticeMode: form.allowPracticeMode,
      allowRealMode: form.allowRealMode,
      practiceUnlockCost: form.practiceUnlockCost || 1,
      isActive: form.isActive,
      examPdfUrl: form.examPdfUrl || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "แก้ไขข้อสอบจำลอง" : "สร้างข้อสอบจำลองใหม่"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>ชื่อข้อสอบ</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>คำอธิบาย</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>วิชา</Label>
              <Select value={form.subject} onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}>
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
              <Label>ระดับชั้น (ไม่บังคับ)</Label>
              <Select value={form.gradeLevel || "__none"} onValueChange={(v) => setForm((f) => ({ ...f, gradeLevel: v === "__none" ? "" : v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทุกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">ทุกระดับชั้น</SelectItem>
                  {gradeLevelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ผูกกับคอร์ส (ไม่บังคับ — ผู้เรียนที่ลงทะเบียนคอร์สนี้จะได้สิทธิ์สอบจริงฟรี)</Label>
            <Select value={form.courseId || "__none"} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v === "__none" ? "" : v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="ไม่ผูกกับคอร์ส" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">ไม่ผูกกับคอร์ส</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>เวลาจำกัด (นาที, ว่าง = ไม่จำกัด)</Label>
              <Input type="number" min={0} value={form.timeLimit} onChange={(e) => setForm((f) => ({ ...f, timeLimit: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>คะแนนผ่าน</Label>
              <Input type="number" min={0} value={form.passingMarks} onChange={(e) => setForm((f) => ({ ...f, passingMarks: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ราคา (0 = ฟรี)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>ราคาลด (ไม่บังคับ)</Label>
              <Input type="number" min={0} value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-gray-400">
            ถ้าราคามากกว่า 0 นักเรียนต้องซื้อก่อนจึงจะเข้าโหมดสอบจริงได้ (โหมดฝึกฝนใช้ token ไม่เกี่ยวกับราคานี้) — ถ้าผูกกับคอร์ส การซื้อคอร์สนั้นจะปลดล็อคให้อัตโนมัติโดยไม่ต้องซื้อซ้ำ
          </p>

          <div className="space-y-2">
            <Label>แนบไฟล์โจทย์ PDF (ไม่บังคับ)</Label>
            <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
            {form.examPdfUrl ? (
              <div className="flex items-center gap-2 rounded-md border border-gray-100 p-2">
                <FileText className="h-4 w-4 shrink-0 text-red-500" />
                <a href={form.examPdfUrl} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-blue-600 underline">
                  {form.examPdfUrl}
                </a>
                <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f) => ({ ...f, examPdfUrl: "" }))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled={uploadingPdf} onClick={() => pdfInputRef.current?.click()}>
                {uploadingPdf ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                อัพโหลดไฟล์ PDF
              </Button>
            )}
            <p className="text-xs text-gray-400">
              ถ้าแนบไฟล์ PDF นักเรียนจะเห็นข้อสอบเป็น PDF พร้อมพื้นที่ร่างคำตอบ แทนรายการคำถามแบบพิมพ์ทีละข้อ — คำถาม/ตัวเลือกที่จัดการด้านล่าง (หลังบันทึก) จะใช้เป็นเฉลย/คะแนนเท่านั้น
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 p-3">
            <div className="mb-3 flex items-center justify-between">
              <Label>เปิดโหมดฝึกซ้อม (Practice)</Label>
              <Switch checked={form.allowPracticeMode} onCheckedChange={(v) => setForm((f) => ({ ...f, allowPracticeMode: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>เปิดโหมดสอบจริง (Real)</Label>
              <Switch checked={form.allowRealMode} onCheckedChange={(v) => setForm((f) => ({ ...f, allowRealMode: v }))} />
            </div>
            {!form.allowPracticeMode && !form.allowRealMode && (
              <p className="mt-2 text-xs text-red-600">ต้องเปิดใช้งานอย่างน้อยหนึ่งโหมด (ฝึกฝน หรือ สอบจริง)</p>
            )}
            {form.allowRealMode && (
              <div className="mt-3 space-y-2">
                <Label>จำนวนครั้งที่สอบจริงได้</Label>
                <Input type="number" min={1} value={form.attemptsAllowed} onChange={(e) => setForm((f) => ({ ...f, attemptsAllowed: e.target.value }))} />
              </div>
            )}
            {form.allowPracticeMode && (
              <div className="mt-3 space-y-2">
                <Label>โทเคนที่ใช้ปลดล็อก 1 คำถาม (โหมดฝึกซ้อม)</Label>
                <Input type="number" min={1} value={form.practiceUnlockCost} onChange={(e) => setForm((f) => ({ ...f, practiceUnlockCost: e.target.value }))} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>เปิดใช้งาน</Label>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
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
