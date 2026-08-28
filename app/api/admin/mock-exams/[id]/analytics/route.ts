import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { getExamItemAnalysis } from "@/lib/mockExamAnalytics"

// GET: /api/admin/mock-exams/[id]/analytics - item analysis (difficulty,
// discrimination, distractor quality) + score distribution for one exam.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const exam = await prisma.mockExam.findUnique({
      where: { id },
      select: { id: true, title: true, subject: true, passingMarks: true },
    })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบจำลองนี้" }, { status: 404 })

    const analysis = await getExamItemAnalysis(id)

    return NextResponse.json({ success: true, data: { exam, ...analysis } })
  } catch (error) {
    console.error("Error fetching mock exam analytics:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการโหลดสถิติ" }, { status: 500 })
  }
}
