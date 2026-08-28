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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import type { AdminCategory } from "@/hooks/admin/useCategories"

const categorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่"),
  description: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const DEFAULT_VALUES: CategoryFormValues = { name: "", description: "" }

export default function CategoryModal({
  open,
  editing,
  onCancel,
  onSubmit,
  submitting = false,
}: {
  open: boolean
  editing: AdminCategory | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  submitting?: boolean
}) {
  const form = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({ name: editing.name, description: editing.description ?? "" })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const handleSubmit = async (values: CategoryFormValues) => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขหมวดหมู่" : "สร้างหมวดหมู่ใหม่"}
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
