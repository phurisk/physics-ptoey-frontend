import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"
import { uploadToVercelBlob, generateUniqueFilename, validateFile } from "@/lib/vercel-blob"

const ALLOWED_TYPES: Record<string, string[]> = {
  "mock-question-image": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  "mock-option-image": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  "mock-explanation-image": ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  "mock-exam-pdf": ["application/pdf"],
  "flashcard-image": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  general: [],
}

const FOLDER_BY_TYPE: Record<string, string> = {
  "mock-question-image": "mock-questions",
  "mock-option-image": "mock-options",
  "mock-explanation-image": "mock-explanations",
  "mock-exam-pdf": "mock-exam-pdfs",
  "flashcard-image": "flashcards",
  general: "uploads",
}

// POST: /api/upload-blob - admin-only generic image upload to Vercel Blob,
// used by rich-content editors (mock exam questions, flashcards) that need
// to attach images/GIFs rather than paste a URL.
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const type = (formData.get("type") as string) || "general"

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    const allowedTypes = ALLOWED_TYPES[type] ?? []
    const validation = validateFile(file, allowedTypes)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.errors.join(", ") }, { status: 400 })
    }

    const folder = FOLDER_BY_TYPE[type] || "uploads"
    const pathname = `${folder}/${generateUniqueFilename(file.name)}`
    const result = await uploadToVercelBlob(file, pathname)

    return NextResponse.json({ success: true, data: { url: result.url, pathname: result.pathname } })
  } catch (error) {
    console.error("Upload blob error:", error)
    return NextResponse.json({ success: false, error: "อัพโหลดไฟล์ไม่สำเร็จ" }, { status: 500 })
  }
}
