import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/exams/[id]/files - just the file list for one exam-bank entry, public
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const exam = await prisma.examBank.findUnique({ where: { id, isActive: true }, select: { id: true } })
    if (!exam) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ", data: [] }, { status: 404 })
    }

    const files = await prisma.examFile.findMany({
      where: { examId: id },
      select: { id: true, fileName: true, filePath: true, fileType: true, fileSize: true, uploadedAt: true, isDownload: true },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json({ success: true, data: files })
  } catch (error) {
    console.error("Get exam bank files error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงไฟล์ข้อสอบ", data: [] }, { status: 500 })
  }
}
