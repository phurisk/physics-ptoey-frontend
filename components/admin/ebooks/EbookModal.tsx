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
import type { AdminEbook } from "@/hooks/admin/useEbooks"

const ebookSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อหนังสือ"),
  author: z.string().min(1, "กรุณากรอกชื่อผู้เขียน"),
  description: z.string().optional(),
  isbn: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  discountPrice: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  coverImageUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  pageCount: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  publishedYear: z.union([z.coerce.number().min(1900), z.literal("")]).optional(),
  language: z.string().default("th"),
  format: z.enum(["PDF", "EPUB", "MOBI"]),
  categoryId: z.string().optional(),
  downloadLimit: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  accessDuration: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPhysical: z.boolean().default(false),
  weight: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  dimensions: z.string().optional(),
})

type EbookFormValues = z.infer<typeof ebookSchema>

const DEFAULT_VALUES: EbookFormValues = {
  title: "",
  author: "",
  description: "",
  isbn: "",
  price: 0,
  discountPrice: "",
  coverImageUrl: "",
  previewUrl: "",
  fileUrl: "",
  pageCount: "",
  publishedYear: "",
  language: "th",
  format: "PDF",
  categoryId: "",
  downloadLimit: "",
  accessDuration: "",
  isActive: true,
  isFeatured: false,
  isPhysical: false,
  weight: "",
  dimensions: "",
}

export default function EbookModal({
  open,
  editing,
  onCancel,
  onSubmit,
  categories,
  submitting = false,
}: {
  open: boolean
  editing: AdminEbook | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  categories: { id: string; name: string }[]
  submitting?: boolean
}) {
  const form = useForm<EbookFormValues>({ resolver: zodResolver(ebookSchema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        title: editing.title,
        author: editing.author,
        description: editing.description ?? "",
        isbn: editing.isbn ?? "",
        price: editing.price,
        discountPrice: editing.discountPrice ?? "",
        coverImageUrl: editing.coverImageUrl ?? "",
        previewUrl: editing.previewUrl ?? "",
        fileUrl: editing.fileUrl ?? "",
        pageCount: editing.pageCount ?? "",
        publishedYear: editing.publishedYear ?? "",
        language: editing.language,
        format: editing.format as EbookFormValues["format"],
        categoryId: editing.categoryId ?? "",
        downloadLimit: editing.downloadLimit ?? "",
        accessDuration: editing.accessDuration ?? "",
        isActive: editing.isActive,
        isFeatured: editing.isFeatured,
        isPhysical: editing.isPhysical,
        weight: editing.weight ?? "",
        dimensions: editing.dimensions ?? "",
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const isPhysical = form.watch("isPhysical")

  const handleSubmit = async (values: EbookFormValues) => {
    await onSubmit({
      ...values,
      discountPrice: values.discountPrice === "" ? null : values.discountPrice,
      pageCount: values.pageCount === "" ? null : values.pageCount,
      publishedYear: values.publishedYear === "" ? null : values.publishedYear,
      downloadLimit: values.downloadLimit === "" ? null : values.downloadLimit,
      accessDuration: values.accessDuration === "" ? null : values.accessDuration,
      weight: values.weight === "" ? null : values.weight,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขอีบุ๊ก" : "สร้างอีบุ๊กใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อหนังสือ</FormLabel>
                    <FormControl>
                      <Input placeholder="ใส่ชื่อหนังสือ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ผู้เขียน</FormLabel>
                    <FormControl>
                      <Input placeholder="ใส่ชื่อผู้เขียน" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="รายละเอียดหนังสือ" {...field} />
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
                  <FormLabel>URL รูปปก</FormLabel>
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
                name="previewUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL ตัวอย่าง (Preview)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL ไฟล์ (fileUrl)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input placeholder="978-0123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ปีที่ตีพิมพ์</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pageCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนหน้า</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="250" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รูปแบบ</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกรูปแบบ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="EPUB">EPUB</SelectItem>
                        <SelectItem value="MOBI">MOBI</SelectItem>
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
                name="downloadLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนครั้งที่ดาวน์โหลดได้</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="ไม่จำกัด" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accessDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนวันที่เข้าถึงได้</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="ไม่จำกัด" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">เปิดใช้งาน</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">อีบุ๊กแนะนำ (Featured)</FormLabel>
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
                  <FormLabel className="!mt-0">สินค้าที่ต้องจัดส่ง (หนังสือกายภาพ)</FormLabel>
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
