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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import type { AdminPost } from "@/hooks/admin/usePosts"

const postSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อบทความ"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  imageUrl: z.string().optional(),
  imageUrlMobileMode: z.string().optional(),
  slug: z.string().optional(),
  postTypeId: z.string().min(1, "กรุณาเลือกประเภทบทความ"),
  publishedAt: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

type PostFormValues = z.infer<typeof postSchema>

const DEFAULT_VALUES: PostFormValues = {
  title: "",
  content: "",
  excerpt: "",
  imageUrl: "",
  imageUrlMobileMode: "",
  slug: "",
  postTypeId: "",
  publishedAt: "",
  isActive: true,
  isFeatured: false,
}

// Converts an ISO datetime string to the value <input type="datetime-local"> expects (no seconds/timezone).
const toDateTimeLocal = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PostModal({
  open,
  editing,
  onCancel,
  onSubmit,
  postTypes,
  submitting = false,
}: {
  open: boolean
  editing: AdminPost | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  postTypes: { id: string; name: string }[]
  submitting?: boolean
}) {
  const form = useForm<PostFormValues>({ resolver: zodResolver(postSchema), defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        title: editing.title,
        content: editing.content ?? "",
        excerpt: editing.excerpt ?? "",
        imageUrl: editing.imageUrl ?? "",
        imageUrlMobileMode: editing.imageUrlMobileMode ?? "",
        slug: editing.slug ?? "",
        postTypeId: editing.postTypeId,
        publishedAt: toDateTimeLocal(editing.publishedAt),
        isActive: editing.isActive,
        isFeatured: editing.isFeatured,
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const handleSubmit = async (values: PostFormValues) => {
    await onSubmit({
      ...values,
      publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อบทความ</FormLabel>
                  <FormControl>
                    <Input placeholder="ใส่ชื่อบทความ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="เว้นว่างเพื่อไม่กำหนด slug" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำโปรย (Excerpt)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="สรุปสั้นๆ ของบทความ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เนื้อหาบทความ</FormLabel>
                  <FormControl>
                    <Textarea rows={8} placeholder="เนื้อหาบทความ" {...field} />
                  </FormControl>
                  <FormDescription>
                    เนื้อหาหลักของบทความ (บล็อกเนื้อหาแบบหลายรายการยังไม่รองรับในหน้านี้)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL รูปภาพ</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrlMobileMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL รูปภาพ (มือถือ)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="postTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทบทความ</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกประเภทบทความ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {postTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
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
              name="publishedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>วันที่เผยแพร่</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>เว้นว่างเพื่อเก็บเป็นฉบับร่าง (ยังไม่เผยแพร่)</FormDescription>
                  <FormMessage />
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
                  <FormLabel className="!mt-0">บทความแนะนำ (Featured)</FormLabel>
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
