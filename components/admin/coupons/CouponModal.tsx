"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Plus, Loader2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import type { AdminCoupon } from "@/hooks/admin/useCoupons"

const toDatetimeLocal = (value?: string | Date | null) => {
  if (!value) return ""
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const defaultValidFrom = () => toDatetimeLocal(new Date())
const defaultValidUntil = () => toDatetimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

const specificItemSchema = z.object({
  itemType: z.enum(["COURSE", "EBOOK"]),
  itemId: z.string().min(1),
  label: z.string().optional(),
})

const couponSchema = z
  .object({
    code: z
      .string()
      .min(3, "รหัสคูปองต้องมีอย่างน้อย 3 ตัวอักษร")
      .regex(/^[A-Za-z0-9]+$/, "รหัสคูปองใช้ได้เฉพาะตัวอักษรและตัวเลขเท่านั้น"),
    name: z.string().min(1, "กรุณากรอกชื่อคูปอง"),
    description: z.string().optional(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
    value: z.coerce.number().min(0).default(0),
    minOrderAmount: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
    maxDiscount: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
    usageLimit: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
    userUsageLimit: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
    isActive: z.boolean().default(true),
    validFrom: z.string().min(1, "กรุณาเลือกวันที่เริ่มต้น"),
    validUntil: z.string().min(1, "กรุณาเลือกวันที่สิ้นสุด"),
    applicableType: z.enum(["ALL", "COURSE_ONLY", "EBOOK_ONLY", "CATEGORY", "SPECIFIC_ITEM"]),
    categoryIds: z.array(z.string()).default([]),
    specificItems: z.array(specificItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "FREE_SHIPPING") {
      const v = Number(data.value)
      if (data.value === undefined || data.value === null || Number.isNaN(v)) {
        ctx.addIssue({ path: ["value"], code: z.ZodIssueCode.custom, message: "กรุณาใส่ค่าส่วนลด" })
      } else if (data.type === "PERCENTAGE" && (v <= 0 || v > 100)) {
        ctx.addIssue({ path: ["value"], code: z.ZodIssueCode.custom, message: "เปอร์เซ็นต์ส่วนลดต้องอยู่ระหว่าง 1-100" })
      } else if (data.type === "FIXED_AMOUNT" && v <= 0) {
        ctx.addIssue({ path: ["value"], code: z.ZodIssueCode.custom, message: "จำนวนเงินส่วนลดต้องมากกว่า 0" })
      }
    }
    if (data.validFrom && data.validUntil && new Date(data.validFrom) >= new Date(data.validUntil)) {
      ctx.addIssue({ path: ["validUntil"], code: z.ZodIssueCode.custom, message: "วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่มต้น" })
    }
    if (data.applicableType === "CATEGORY" && data.categoryIds.length === 0) {
      ctx.addIssue({ path: ["categoryIds"], code: z.ZodIssueCode.custom, message: "กรุณาเลือกหมวดหมู่อย่างน้อย 1 รายการ" })
    }
    if (data.applicableType === "SPECIFIC_ITEM" && data.specificItems.length === 0) {
      ctx.addIssue({ path: ["specificItems"], code: z.ZodIssueCode.custom, message: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" })
    }
  })

type CouponFormValues = z.infer<typeof couponSchema>

const DEFAULT_VALUES: CouponFormValues = {
  code: "",
  name: "",
  description: "",
  type: "PERCENTAGE",
  value: 0,
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  userUsageLimit: "",
  isActive: true,
  validFrom: defaultValidFrom(),
  validUntil: defaultValidUntil(),
  applicableType: "ALL",
  categoryIds: [],
  specificItems: [],
}

export default function CouponModal({
  open,
  editing,
  onCancel,
  onSubmit,
  categories,
  courses,
  ebooks,
  submitting = false,
}: {
  open: boolean
  editing: AdminCoupon | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  categories: { id: string; name: string }[]
  courses: { id: string; title: string }[]
  ebooks: { id: string; title: string }[]
  submitting?: boolean
}) {
  const form = useForm<CouponFormValues>({ resolver: zodResolver(couponSchema), defaultValues: DEFAULT_VALUES })
  const [pickerItemType, setPickerItemType] = useState<"COURSE" | "EBOOK">("COURSE")
  const [pickerItemId, setPickerItemId] = useState("")

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        code: editing.code,
        name: editing.name,
        description: editing.description ?? "",
        type: editing.type,
        value: editing.value,
        minOrderAmount: editing.minOrderAmount ?? "",
        maxDiscount: editing.maxDiscount ?? "",
        usageLimit: editing.usageLimit ?? "",
        userUsageLimit: editing.userUsageLimit ?? "",
        isActive: editing.isActive,
        validFrom: toDatetimeLocal(editing.validFrom),
        validUntil: toDatetimeLocal(editing.validUntil),
        applicableType: editing.applicableType,
        categoryIds: (editing.categories || []).map((c) => c.categoryId),
        specificItems: (editing.items || []).map((it) => ({
          itemType: it.itemType,
          itemId: it.itemId,
          label:
            it.itemType === "COURSE"
              ? courses.find((c) => c.id === it.itemId)?.title
              : ebooks.find((e) => e.id === it.itemId)?.title,
        })),
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
    setPickerItemId("")
    setPickerItemType("COURSE")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, form])

  const type = form.watch("type")
  const applicableType = form.watch("applicableType")
  const categoryIds = form.watch("categoryIds")
  const specificItems = form.watch("specificItems")

  const toggleCategory = (id: string, checked: boolean) => {
    const next = checked ? [...categoryIds, id] : categoryIds.filter((c) => c !== id)
    form.setValue("categoryIds", next, { shouldValidate: true })
  }

  const addSpecificItem = () => {
    if (!pickerItemId) return
    if (specificItems.some((it) => it.itemType === pickerItemType && it.itemId === pickerItemId)) return
    const label =
      pickerItemType === "COURSE" ? courses.find((c) => c.id === pickerItemId)?.title : ebooks.find((e) => e.id === pickerItemId)?.title
    form.setValue("specificItems", [...specificItems, { itemType: pickerItemType, itemId: pickerItemId, label }], { shouldValidate: true })
    setPickerItemId("")
  }

  const removeSpecificItem = (itemType: "COURSE" | "EBOOK", itemId: string) => {
    form.setValue(
      "specificItems",
      specificItems.filter((it) => !(it.itemType === itemType && it.itemId === itemId)),
      { shouldValidate: true }
    )
  }

  const handleSubmit = async (values: CouponFormValues) => {
    await onSubmit({
      ...values,
      minOrderAmount: values.minOrderAmount === "" ? null : values.minOrderAmount,
      maxDiscount: values.maxDiscount === "" ? null : values.maxDiscount,
      usageLimit: values.usageLimit === "" ? null : values.usageLimit,
      userUsageLimit: values.userUsageLimit === "" ? null : values.userUsageLimit,
      value: values.type === "FREE_SHIPPING" ? 0 : values.value,
      validFrom: new Date(values.validFrom).toISOString(),
      validUntil: new Date(values.validUntil).toISOString(),
    })
  }

  const pickerOptions = pickerItemType === "COURSE" ? courses : ebooks

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขคูปอง" : "สร้างคูปองใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสคูปอง</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น SAVE20" className="uppercase" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อคูปอง</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น ลด 20% สำหรับสมาชิกใหม่" {...field} />
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
                  <FormLabel>คำอธิบาย</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="อธิบายรายละเอียดคูปอง เงื่อนไข และข้อกำหนด" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทคูปอง</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">ส่วนลดเปอร์เซ็นต์ (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">ส่วนลดจำนวนคงที่ (฿)</SelectItem>
                        <SelectItem value="FREE_SHIPPING">ฟรีค่าจัดส่ง</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {type !== "FREE_SHIPPING" && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{type === "PERCENTAGE" ? "เปอร์เซ็นต์ส่วนลด" : "จำนวนเงินส่วนลด"}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={type === "PERCENTAGE" ? 100 : undefined} placeholder={type === "PERCENTAGE" ? "20" : "100"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยอดขั้นต่ำ (฿)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="ไม่จำกัด" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {type === "PERCENTAGE" && (
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ส่วนลดสูงสุด (฿)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="ไม่จำกัด" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำกัดจำนวนการใช้งานทั้งหมด</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="ไม่จำกัด" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userUsageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำกัดจำนวนการใช้งานต่อคน</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="ไม่จำกัด" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่เริ่มต้น</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่สิ้นสุด</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">{field.value ? "เปิดใช้งาน" : "ปิดใช้งาน"}</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicableType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ขอบเขตการใช้งาน</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกสินค้า</SelectItem>
                      <SelectItem value="COURSE_ONLY">คอร์สเท่านั้น</SelectItem>
                      <SelectItem value="EBOOK_ONLY">E-book เท่านั้น</SelectItem>
                      <SelectItem value="CATEGORY">หมวดหมู่ที่กำหนด</SelectItem>
                      <SelectItem value="SPECIFIC_ITEM">สินค้าที่กำหนด</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {applicableType === "CATEGORY" && (
              <FormField
                control={form.control}
                name="categoryIds"
                render={() => (
                  <FormItem>
                    <FormLabel>เลือกหมวดหมู่ที่ใช้ได้</FormLabel>
                    <ScrollArea className="h-40 rounded-md border p-3">
                      <div className="space-y-2">
                        {categories.length === 0 ? (
                          <p className="text-sm text-gray-400">ไม่มีหมวดหมู่</p>
                        ) : (
                          categories.map((cat) => (
                            <div key={cat.id} className="flex items-center gap-2">
                              <Checkbox checked={categoryIds.includes(cat.id)} onCheckedChange={(checked) => toggleCategory(cat.id, !!checked)} />
                              <span className="text-sm">{cat.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {applicableType === "SPECIFIC_ITEM" && (
              <FormField
                control={form.control}
                name="specificItems"
                render={() => (
                  <FormItem>
                    <FormLabel>เลือกสินค้าที่ใช้ได้</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        value={pickerItemType}
                        onValueChange={(v) => {
                          setPickerItemType(v as "COURSE" | "EBOOK")
                          setPickerItemId("")
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COURSE">คอร์ส</SelectItem>
                          <SelectItem value="EBOOK">E-book</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={pickerItemId} onValueChange={setPickerItemId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={pickerItemType === "COURSE" ? "เลือกคอร์ส" : "เลือก E-book"} />
                        </SelectTrigger>
                        <SelectContent>
                          {pickerOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={addSpecificItem} disabled={!pickerItemId}>
                        เพิ่ม
                      </Button>
                    </div>
                    <FormDescription>สินค้าที่เลือกไว้จะถูกใช้เป็นเงื่อนไขว่าคูปองนี้ใช้ได้กับสินค้าใดบ้าง</FormDescription>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {specificItems.map((it) => (
                        <Badge key={`${it.itemType}-${it.itemId}`} variant="outline" className="flex items-center gap-1">
                          <span className="text-[10px] uppercase text-gray-400">{it.itemType === "COURSE" ? "คอร์ส" : "E-book"}</span>
                          {it.label || it.itemId}
                          <button type="button" onClick={() => removeSpecificItem(it.itemType, it.itemId)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
