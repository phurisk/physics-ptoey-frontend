"use client"

import { useRef, useState } from "react"
import { FileText, Loader2, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

/**
 * Same idea as ImageUploadField, for non-image documents (PDF/EPUB/etc.) —
 * a link to the current file instead of an <img> preview.
 */
export function FileUploadField({
  value,
  onChange,
  uploadType,
  accept,
  placeholder = "https://...",
}: {
  value: string
  onChange: (url: string) => void
  uploadType: string
  accept?: string
  placeholder?: string
}) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", uploadType)
      const res = await fetch("/api/upload-blob", { method: "POST", body: formData })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || "Upload failed")
      onChange(result.data.url)
      toast({ title: "อัพโหลดไฟล์สำเร็จ" })
    } catch (error) {
      toast({ variant: "destructive", title: `อัพโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : ""}` })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          {uploading ? "" : "อัพโหลด"}
        </Button>
      </div>
      {value && (
        <div className="flex items-center gap-2">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            เปิดไฟล์ปัจจุบัน
          </a>
          <button type="button" onClick={() => onChange("")} className="text-gray-400 hover:text-red-500">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
