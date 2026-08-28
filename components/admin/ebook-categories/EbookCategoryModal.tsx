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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import type { AdminEbookCategory } from "@/hooks/admin/useEbookCategories"

const ebookCategorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type EbookCategoryFormValues = z.infer<typeof ebookCategorySchema>

const DEFAULT_VALUES: EbookCategoryFormValues = { name: "", description: "", isActive: true }

export default function EbookCategoryModal({
  open,
  editing,
  onCancel,
  onSubmit,
  submitting = false,
}: {
  open: boolean
  editing: AdminEbookCategory | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  submitting?: boolean
}) {
  const form = useForm<EbookCategoryFormValues>({ resolver: zodResolver(ebookCategorySchema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({ name: editing.name, description: editing.description ?? "", isActive: editing.isActive })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const handleSubmit = async (values: EbookCategoryFormValues) => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขหมวดหมู่อีบุ๊ก" : "สร้างหมวดหมู่อีบุ๊กใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อหมวดหมู่</FormLabel>
                  <FormControl>
                    <Input placeholder="ใส่ชื่อหมวดหมู่" {...field} />
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
                    <Textarea rows={3} placeholder="รายละเอียดหมวดหมู่ (ไม่บังคับ)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
