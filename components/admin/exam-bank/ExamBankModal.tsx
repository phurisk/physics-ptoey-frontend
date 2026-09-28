"use client"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Plus, Loader2, FileIcon, Download, Upload, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import type { AdminExamBank, AdminExamFile } from "@/hooks/admin/useExamBank"

const examBankSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่อข้อสอบ"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
})

type ExamBankFormValues = z.infer<typeof examBankSchema>

const DEFAULT_VALUES: ExamBankFormValues = {
  title: "",
  description: "",
  categoryId: "",
  isActive: true,
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "-"
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export default function ExamBankModal({
  open,
  editing,
  onCancel,
  onSubmit,
  categories,
  submitting = false,
  onFilesChanged,
}: {
  open: boolean
  editing: AdminExamBank | null
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  categories: { id: string; name: string }[]
  submitting?: boolean
  /** Called after a file is attached/removed, so the parent list (which owns
   *  `editing`) can refetch and keep file counts/rows in sync. */
  onFilesChanged?: () => void
}) {
  const { toast } = useToast()
  const form = useForm<ExamBankFormValues>({ resolver: zodResolver(examBankSchema), defaultValues: DEFAULT_VALUES })

  const [files, setFiles] = useState<AdminExamFile[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        title: editing.title,
        description: editing.description ?? "",
        categoryId: editing.categoryId ?? "",
        isActive: editing.isActive,
      })
      setFiles(editing.files)
    } else {
      form.reset(DEFAULT_VALUES)
      setFiles([])
    }
  }, [open, editing, form])

  const handleSubmit = async (values: ExamBankFormValues) => {
    await onSubmit(values)
  }

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !editing) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "exam-bank-file")
      const uploadRes = await fetch("/api/upload-blob", { method: "POST", body: formData })
      const uploadResult = await uploadRes.json()
      if (!uploadResult.success) throw new Error(uploadResult.error || "Upload failed")

      const attachRes = await fetch(`/api/admin/exam-bank/${editing.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, filePath: uploadResult.data.url, fileType: file.type, fileSize: file.size }),
      })
      const attachResult = await attachRes.json()
      if (!attachResult.success) throw new Error(attachResult.error || "แนบไฟล์ไม่สำเร็จ")

      setFiles((prev) => [attachResult.data as AdminExamFile, ...prev])
      onFilesChanged?.()
      toast({ title: "แนบไฟล์สำเร็จ" })
    } catch (error) {
      toast({ variant: "destructive", title: `แนบไฟล์ไม่สำเร็จ: ${error instanceof Error ? error.message : ""}` })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleRemoveFile = async (fileId: string) => {
    if (!editing) return
    setDeletingFileId(fileId)
    try {
      const res = await fetch(`/api/admin/exam-bank/${editing.id}/files/${fileId}`, { method: "DELETE" })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || "ลบไฟล์ไม่สำเร็จ")
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      onFilesChanged?.()
      toast({ title: "ลบไฟล์สำเร็จ" })
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไฟล์ไม่สำเร็จ" })
    } finally {
      setDeletingFileId(null)
    }
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

            {editing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>ไฟล์แนบ</FormLabel>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachFile} />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingFile} onClick={() => fileInputRef.current?.click()}>
                    {uploadingFile ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                    แนบไฟล์
                  </Button>
                </div>
                <div className="rounded-md border border-gray-100">
                  {files.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400">ยังไม่มีไฟล์แนบสำหรับข้อสอบนี้</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ชื่อไฟล์</TableHead>
                          <TableHead>ประเภท</TableHead>
                          <TableHead>ขนาด</TableHead>
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {files.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell className="flex items-center gap-1.5 text-sm">
                              <FileIcon className="h-3.5 w-3.5 text-gray-400" />
                              {file.fileName}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{file.fileType || "-"}</TableCell>
                            <TableCell className="text-sm text-gray-600">{formatFileSize(file.fileSize)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-3">
                                <a
                                  href={file.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  เปิดไฟล์
                                </a>
                                <button
                                  type="button"
                                  disabled={deletingFileId === file.id}
                                  onClick={() => handleRemoveFile(file.id)}
                                  className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                                >
                                  {deletingFileId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
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
