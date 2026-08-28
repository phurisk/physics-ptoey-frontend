import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/exams/[id] - exam-bank entry detail (+ downloadable files), public
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const exam = await prisma.examBank.findUnique({
      where: { id, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        files: { select: { id: true, fileName: true, filePath: true, fileType: true, fileSize: true, uploadedAt: true, isDownload: true }, orderBy: { uploadedAt: "desc" } },
      },
    })

    if (!exam) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Get exam bank entry error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบ" }, { status: 500 })
  }
}
