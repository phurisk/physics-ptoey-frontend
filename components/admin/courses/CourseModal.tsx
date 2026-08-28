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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { getSubjectOptions, getGradeLevelOptions } from "@/lib/constants"
import type { AdminCourse } from "@/hooks/admin/useCourses"

const courseSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อคอร์ส"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  discountPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  sampleVideo: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "DELETED"]),
  instructorId: z.string().min(1, "กรุณาเลือกผู้สอน"),
  categoryId: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  accessDuration: z.union([z.coerce.number().min(1), z.literal("")]).optional(),
  accessHours: z.union([z.coerce.number().min(1), z.literal("")]).optional(),
  isRecommended: z.boolean().default(false),
  isPhysical: z.boolean().default(false),
  weight: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  dimensions: z.string().optional(),
})

type CourseFormValues = z.infer<typeof courseSchema>

const DEFAULT_VALUES: CourseFormValues = {
  title: "",
  description: "",
  coverImageUrl: "",
  price: 0,
  discountPrice: "",
  sampleVideo: "",
  status: "DRAFT",
  instructorId: "",
  categoryId: "",
  subject: "",
  gradeLevel: "",
  accessDuration: "",
  accessHours: "",
  isRecommended: false,
  isPhysical: false,
  weight: "",
  dimensions: "",
}

export default function CourseModal({
  open,
  editing,
  onCancel,
  onSubmit,
  instructors,
  categories,
  submitting = false,
}: {
  open: boolean
  editing: AdminCourse | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  instructors: { id: string; name: string; email: string }[]
  categories: { id: string; name: string }[]
  submitting?: boolean
}) {
  const form = useForm<CourseFormValues>({ resolver: zodResolver(courseSchema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        title: editing.title,
        description: editing.description ?? "",
        coverImageUrl: editing.coverImageUrl ?? "",
        price: editing.price,
        discountPrice: editing.discountPrice ?? "",
        sampleVideo: editing.sampleVideo ?? "",
        status: editing.status as CourseFormValues["status"],
        instructorId: editing.instructorId,
        categoryId: editing.categoryId ?? "",
        subject: editing.subject ?? "",
        gradeLevel: editing.gradeLevel ?? "",
        accessDuration: editing.accessDuration ?? "",
        accessHours: editing.accessHours ?? "",
        isRecommended: editing.isRecommended,
        isPhysical: editing.isPhysical,
        weight: editing.weight ?? "",
        dimensions: editing.dimensions ?? "",
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const isPhysical = form.watch("isPhysical")

  const handleSubmit = async (values: CourseFormValues) => {
    await onSubmit({
      ...values,
      discountPrice: values.discountPrice === "" ? null : values.discountPrice,
      accessDuration: values.accessDuration === "" ? null : values.accessDuration,
      accessHours: values.accessHours === "" ? null : values.accessHours,
      weight: values.weight === "" ? null : values.weight,
      isFree: Number(values.price) === 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขคอร์ส" : "สร้างคอร์สใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อคอร์ส</FormLabel>
                  <FormControl>
                    <Input placeholder="ใส่ชื่อคอร์ส" {...field} />
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
                    <Textarea rows={3} placeholder="รายละเอียดคอร์ส" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL รูปปกคอร์ส</FormLabel>
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคา</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาหลังส่วนลด</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sampleVideo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วิดีโอตัวอย่าง</FormLabel>
                  <FormControl>
                    <Input placeholder="URL ของวิดีโอตัวอย่าง (เช่น YouTube, Vimeo)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>สถานะ</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">ฉบับร่าง</SelectItem>
                      <SelectItem value="PUBLISHED">เผยแพร่</SelectItem>
                      <SelectItem value="CLOSED">ปิด</SelectItem>
                      <SelectItem value="DELETED">ถูกลบ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ผู้สอน</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกผู้สอน" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instructors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} ({i.email})
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมวดหมู่</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วิชา</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกวิชา" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getSubjectOptions().map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ระดับชั้น</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกระดับชั้น" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getGradeLevelOptions().map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accessDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนวันที่เรียนได้</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accessHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนชั่วโมงที่เรียนได้</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="120" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isRecommended"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">คอร์สแนะนำ (Recommended)</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPhysical"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">สินค้าที่ต้องจัดส่ง (เช่น หนังสือประกอบ, CD, DVD)</FormLabel>
                </FormItem>
              )}
            />

            {isPhysical && (
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>น้ำหนัก (กรัม)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ขนาด (กว้าง x ยาว x สูง)</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น 15 x 21 x 2 (ซม.)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
