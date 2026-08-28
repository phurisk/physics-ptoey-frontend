"use client"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import type { AdminUser } from "@/hooks/admin/useUsers"

const baseSchema = {
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("อีเมลไม่ถูกต้อง"),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  school: z.string().optional(),
}

// Password is required on create, optional on edit (blank = leave unchanged).
const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
})
const editSchema = z.object({
  ...baseSchema,
  password: z.union([z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"), z.literal("")]).optional(),
})

type UserFormValues = z.infer<typeof editSchema>

const DEFAULT_VALUES: UserFormValues = {
  name: "",
  email: "",
  role: "STUDENT",
  school: "",
  password: "",
}

export default function UserModal({
  open,
  editing,
  onCancel,
  onSubmit,
  submitting = false,
}: {
  open: boolean
  editing: AdminUser | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  submitting?: boolean
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        name: editing.name ?? "",
        email: editing.email ?? "",
        role: editing.role,
        school: editing.school ?? "",
        password: "",
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, editing, form])

  const handleSubmit = async (values: UserFormValues) => {
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
      role: values.role,
      school: values.school || null,
    }
    // Only send password when the admin actually typed one — editing leaves
    // the existing hash untouched otherwise.
    if (values.password) payload.password = values.password
    await onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "แก้ไขผู้ใช้งาน" : "สร้างผู้ใช้งานใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {editing?.lineId && (
              <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
                LINE ID: <span className="font-mono text-gray-700">{editing.lineId}</span> (เชื่อมต่อจากการล็อกอินด้วย LINE)
              </p>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ</FormLabel>
                  <FormControl>
                    <Input placeholder="ชื่อ-นามสกุล" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อีเมล</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>โรงเรียน</FormLabel>
                  <FormControl>
                    <Input placeholder="ชื่อโรงเรียน" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>บทบาท</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกบทบาท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STUDENT">นักเรียน</SelectItem>
                      <SelectItem value="INSTRUCTOR">ผู้สอน</SelectItem>
                      <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={editing ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "อย่างน้อย 6 ตัวอักษร"} {...field} />
                  </FormControl>
                  {editing && <FormDescription>เว้นว่างไว้เพื่อคงรหัสผ่านเดิม</FormDescription>}
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
