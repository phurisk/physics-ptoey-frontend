"use client"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { getExamTypeOptions } from "@/lib/constants"
import type { AdminExam, AdminExamCourseOption } from "@/hooks/admin/useExams"

const examSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อข้อสอบ"),
  description: z.string().optional(),
  courseId: z.string().min(1, "กรุณาเลือกคอร์ส"),
  examType: z.enum(["PRETEST", "POSTTEST", "QUIZ", "MIDTERM", "FINAL", "PRACTICE"]),
  timeLimit: z.union([z.coerce.number().min(1), z.literal("")]).optional(),
  passingMarks: z.coerce.number().min(0).default(0),
  attemptsAllowed: z.coerce.number().min(1).default(1),
  showResults: z.boolean().default(true),
  showAnswers: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type ExamFormValues = z.infer<typeof examSchema>

const DEFAULT_VALUES: ExamFormValues = {
  title: "",
  description: "",
  courseId: "",
  examType: "QUIZ",
  timeLimit: "",
  passingMarks: 0,
  attemptsAllowed: 1,
  showResults: true,
  showAnswers: false,
  isActive: true,
}

export default function ExamModal({
  open,
  editing,
  onCancel,
  onSubmit,
  courses,
  submitting = false,
}: {
  open: boolean
  editing: AdminExam | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  courses: AdminExamCourseOption[]
  submitting?: boolean
}) {
  const form = useForm<ExamFormValues>({ resolver: zodResolver(examSchema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        title: editing.title,
        description: editing.description ?? "",
        courseId: editing.courseId ?? "",
        examType: editing.examType as ExamFormValues["examType"],
        timeLimit: editing.timeLimit ?? "",
        passingMarks: editing.passingMarks,
        attemptsAllowed: editing.attemptsAllowed,
        showResults: editing.showResults,
        showAnswers: editing.showAnswers,
        isActive: editing.isActive,
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const handleSubmit = async (values: ExamFormValues) => {
    await onSubmit({
      ...values,
      timeLimit: values.timeLimit === "" ? null : values.timeLimit,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขข้อสอบ" : "สร้างข้อสอบใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อข้อสอบ</FormLabel>
                  <FormControl>
                    <Input placeholder="ใส่ชื่อข้อสอบ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="รายละเอียดข้อสอบ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คอร์ส</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกคอร์ส" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทข้อสอบ</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกประเภทข้อสอบ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getExamTypeOptions().map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เวลาที่กำหนด (นาที)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="ไม่จำกัดเวลา" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passingMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คะแนนผ่าน</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attemptsAllowed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนครั้งที่ทำได้</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="showResults"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <FormLabel className="!mt-0">แสดงผลคะแนนหลังส่งคำตอบ</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showAnswers"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <FormLabel className="!mt-0">แสดงเฉลยหลังส่งคำตอบ</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <FormLabel className="!mt-0">เปิดใช้งานข้อสอบนี้</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "บันทึกการแก้ไข" : "สร้าง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
