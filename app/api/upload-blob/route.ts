import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/requireAdmin"
import { uploadToVercelBlob, generateUniqueFilename, validateFile } from "@/lib/vercel-blob"

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const EBOOK_DOC_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "application/x-mobipocket-ebook",
  "application/vnd.amazon.ebook",
  // Some browsers report EPUB/MOBI (and any file the OS has no mapping for)
  // as this generic type — reject on that alone and a real ebook upload
  // fails, so it's allowed here too.
  "application/octet-stream",
]

const ALLOWED_TYPES: Record<string, string[]> = {
  "mock-question-image": IMAGE_TYPES,
  "mock-option-image": IMAGE_TYPES,
  "mock-explanation-image": [...IMAGE_TYPES, "image/gif"],
  "mock-exam-pdf": ["application/pdf"],
  "flashcard-image": IMAGE_TYPES,
  "flashcard-front-image": IMAGE_TYPES,
  "flashcard-back-image": IMAGE_TYPES,
  "course-cover": IMAGE_TYPES,
  "exam-question-image": IMAGE_TYPES,
  "post-image": IMAGE_TYPES,
  "ebook-cover": IMAGE_TYPES,
  "course-content-pdf": ["application/pdf"],
  "flashcard-deck-cover": IMAGE_TYPES,
  "ebook-preview": EBOOK_DOC_TYPES,
  "ebook-file": EBOOK_DOC_TYPES,
  "exam-bank-file": [
    ...EBOOK_DOC_TYPES,
    ...IMAGE_TYPES,
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
  ],
  general: [],
}

const FOLDER_BY_TYPE: Record<string, string> = {
  "mock-question-image": "mock-questions",
  "mock-option-image": "mock-options",
  "mock-explanation-image": "mock-explanations",
  "mock-exam-pdf": "mock-exam-pdfs",
  "flashcard-image": "flashcards",
  "flashcard-front-image": "flashcards",
  "flashcard-back-image": "flashcards",
  "course-cover": "course-covers",
  "exam-question-image": "exam-questions",
  "post-image": "posts",
  "ebook-cover": "ebook-covers",
  "course-content-pdf": "course-content",
  "flashcard-deck-cover": "flashcard-decks",
  "ebook-preview": "ebook-previews",
  "ebook-file": "ebook-files",
  "exam-bank-file": "exam-bank-files",
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
