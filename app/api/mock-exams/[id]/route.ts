import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/mock-exams/[id] - public exam detail (metadata only, no questions/answers)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const exam = await prisma.mockExam.findUnique({
      where: { id },
      include: { course: { select: { id: true, title: true } }, _count: { select: { questions: true } } },
    })
    if (!exam || !exam.isActive) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Get mock exam error:", error)
    return NextResponse.json({ success: false, error: "Failed to load mock exam" }, { status: 500 })
  }
}
