import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// POST: /api/admin/exam-bank/[id]/files - attach a file to an exam bank entry.
// The actual upload happens client-side against /api/upload-blob first; this
// just records the resulting Blob URL as an ExamFile row.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: examId } = await params
    const body = await req.json()
    const { fileName, filePath, fileType, fileSize, isDownload } = body as {
      fileName?: string
      filePath?: string
      fileType?: string | null
      fileSize?: number | null
      isDownload?: boolean
    }

    if (!fileName || !filePath) {
      return NextResponse.json({ success: false, error: "ข้อมูลไฟล์ไม่ครบถ้วน" }, { status: 400 })
    }

    const exam = await prisma.examBank.findUnique({ where: { id: examId } })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    const file = await prisma.examFile.create({
      data: {
        examId,
        fileName,
        filePath,
        fileType: fileType || null,
        fileSize: fileSize ?? null,
        isDownload: isDownload ?? true,
      },
    })

    return NextResponse.json({ success: true, data: file })
  } catch (error) {
    console.error("Attach exam file error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแนบไฟล์" }, { status: 500 })
  }
}
