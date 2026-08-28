import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { hasMockExamAccess } from "@/lib/mockExamEngine"

// GET: /api/mock-exams/[id]/access - can the current user start a REAL attempt?
// (PRACTICE mode is never gated by this)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const exam = await prisma.mockExam.findUnique({ where: { id } })
    if (!exam || !exam.isActive) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    const hasAccess = await hasMockExamAccess(user.userId, exam)
    return NextResponse.json({ success: true, data: { hasAccess, price: exam.price, discountPrice: exam.discountPrice } })
  } catch (error) {
    console.error("Check mock exam access error:", error)
    return NextResponse.json({ success: false, error: "Failed to check access" }, { status: 500 })
  }
}
