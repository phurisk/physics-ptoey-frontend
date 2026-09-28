"use client"

import { useRef, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

/**
 * URL text field + "upload to Vercel Blob" button + image preview, for any
 * admin form field that stores an image URL. `uploadType` must be a key
 * ALLOWED_TYPES/FOLDER_BY_TYPE in app/api/upload-blob/route.ts recognises.
 *
 * Typing stays a plain string, same as before this existed — so it drops
 * straight into a react-hook-form <FormField> as value={field.value}
 * onChange={field.onChange}, or any other string state.
 */
export function ImageUploadField({
  value,
  onChange,
  uploadType,
  placeholder = "https://...",
}: {
  value: string
  onChange: (url: string) => void
  uploadType: string
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
      toast({ title: "อัพโหลดรูปสำเร็จ" })
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
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          {uploading ? "" : "อัพโหลด"}
        </Button>
      </div>
      {value && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-20 w-32 rounded-md border object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
