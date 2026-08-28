import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// GET: /api/mock-exams - public list of active mock exams (browse page)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const limit = parseInt(searchParams.get("limit") || "", 10) || 9
    const subject = searchParams.get("subject") || ""
    const gradeLevel = searchParams.get("gradeLevel") || ""

    const where: Prisma.MockExamWhereInput = { isActive: true }
    if (subject) where.subject = subject as Prisma.MockExamWhereInput["subject"]
    if (gradeLevel) where.gradeLevel = gradeLevel as Prisma.MockExamWhereInput["gradeLevel"]

    const [total, exams] = await Promise.all([
      prisma.mockExam.count({ where }),
      prisma.mockExam.findMany({
        where,
        include: { course: { select: { id: true, title: true } }, _count: { select: { questions: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: exams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("List mock exams error:", error)
    return NextResponse.json({ success: false, error: "Failed to load mock exams" }, { status: 500 })
  }
}
