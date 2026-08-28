"use client"
import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Plus, Loader2, Trash2, GripVertical } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { getQuestionTypeOptions } from "@/lib/constants"
import type { AdminQuestion } from "@/hooks/admin/useExamQuestions"

const optionSchema = z.object({
  optionText: z.string().min(1, "กรุณากรอกตัวเลือก"),
  isCorrect: z.boolean().default(false),
})

const questionSchema = z
  .object({
    questionText: z.string().min(1, "กรุณากรอกคำถาม"),
    questionImage: z.string().optional(),
    questionType: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
    marks: z.coerce.number().min(1, "คะแนนต้องมากกว่า 0"),
    explanation: z.string().optional(),
    options: z.array(optionSchema),
  })
  .superRefine((data, ctx) => {
    if (data.questionType === "SHORT_ANSWER") return
    if (data.options.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ต้องมีตัวเลือกอย่างน้อย 2 ข้อ", path: ["options"] })
    }
    if (!data.options.some((o) => o.isCorrect)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ต้องเลือกคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ", path: ["options"] })
    }
  })

type QuestionFormValues = z.infer<typeof questionSchema>

const DEFAULT_VALUES: QuestionFormValues = {
  questionText: "",
  questionImage: "",
  questionType: "MULTIPLE_CHOICE",
  marks: 1,
  explanation: "",
  options: [
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ],
}

const TRUE_FALSE_DEFAULT_OPTIONS: QuestionFormValues["options"] = [
  { optionText: "ถูก", isCorrect: false },
  { optionText: "ผิด", isCorrect: false },
]

export default function QuestionModal({
  open,
  editing,
  onCancel,
  onSubmit,
  submitting = false,
}: {
  open: boolean
  editing: AdminQuestion | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  submitting?: boolean
}) {
  const form = useForm<QuestionFormValues>({ resolver: zodResolver(questionSchema), defaultValues: DEFAULT_VALUES })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        questionText: editing.questionText,
        questionImage: editing.questionImage ?? "",
        questionType: editing.questionType as QuestionFormValues["questionType"],
        marks: editing.marks,
        explanation: editing.explanation ?? "",
        options: editing.options.length
          ? editing.options
              .sort((a, b) => a.order - b.order)
              .map((o) => ({ optionText: o.optionText, isCorrect: o.isCorrect }))
          : DEFAULT_VALUES.options,
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const questionType = form.watch("questionType")
  const showOptions = questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE"

  const handleQuestionTypeChange = (value: string) => {
    form.setValue("questionType", value as QuestionFormValues["questionType"])
    if (value === "TRUE_FALSE" && fields.length === 0) {
      form.setValue("options", TRUE_FALSE_DEFAULT_OPTIONS)
    } else if (value === "MULTIPLE_CHOICE" && fields.length === 0) {
      form.setValue("options", DEFAULT_VALUES.options)
    }
  }

  const handleSubmit = async (values: QuestionFormValues) => {
    await onSubmit({
      ...values,
      options: values.questionType === "SHORT_ANSWER" ? [] : values.options.map((o, idx) => ({ ...o, order: idx })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำถาม</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="พิมพ์คำถาม" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL รูปภาพประกอบคำถาม (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทคำถาม</FormLabel>
                    <Select value={field.value} onValueChange={handleQuestionTypeChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกประเภทคำถาม" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getQuestionTypeOptions().map((t) => (
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
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คะแนน</FormLabel>
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
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบายเฉลย (ถ้ามี)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="คำอธิบายเมื่อแสดงเฉลย" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showOptions && (
              <div className="space-y-2 rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <FormLabel>ตัวเลือกคำตอบ</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ optionText: "", isCorrect: false })}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    เพิ่มตัวเลือก
                  </Button>
                </div>

                {fields.map((optionField, index) => (
                  <div key={optionField.id} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                    <FormField
                      control={form.control}
                      name={`options.${index}.isCorrect`}
                      render={({ field }) => (
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} title="คำตอบที่ถูกต้อง" />
                        </FormControl>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.optionText`}
                      render={({ field }) => (
                        <FormItem className="flex-1 space-y-0">
                          <FormControl>
                            <Input placeholder={`ตัวเลือกที่ ${index + 1}`} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {typeof form.formState.errors.options?.message === "string" && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.options.message}</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "บันทึกการแก้ไข" : "เพิ่มคำถาม"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
