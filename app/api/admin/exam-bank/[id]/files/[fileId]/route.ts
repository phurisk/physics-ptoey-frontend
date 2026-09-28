import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// DELETE: /api/admin/exam-bank/[id]/files/[fileId] - detach one file from an
// exam bank entry. Only removes the database row — the Blob object itself is
// left in place, same as every other upload-blob consumer in this codebase.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: examId, fileId } = await params
    const file = await prisma.examFile.findUnique({ where: { id: fileId } })
    if (!file || file.examId !== examId) {
      return NextResponse.json({ success: false, error: "ไม่พบไฟล์ที่ระบุ" }, { status: 404 })
    }

    await prisma.examFile.delete({ where: { id: fileId } })
    return NextResponse.json({ success: true, message: "ลบไฟล์สำเร็จ" })
  } catch (error) {
    console.error("Delete exam file error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบไฟล์" }, { status: 500 })
  }
}
