import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import type { Prisma } from "@prisma/client"

// GET: /api/my-courses/exam-results - the current user's exam attempt history
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1") || 1
    const limit = parseInt(searchParams.get("limit") || "10") || 10
    const courseId = searchParams.get("courseId")
    const status = searchParams.get("status")
    const skip = (page - 1) * limit

    const where: Prisma.ExamAttemptWhereInput = { userId: user.userId }
    if (courseId) where.exam = { courseId }
    if (status === "COMPLETED" || status === "IN_PROGRESS") where.status = status

    const [attempts, count] = await Promise.all([
      prisma.examAttempt.findMany({
        where,
        include: { exam: { select: { id: true, title: true, description: true, examType: true, course: { select: { id: true, title: true } } } } },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.examAttempt.count({ where }),
    ])

    const data = attempts.map((a) => ({
      ...a,
      duration: a.completedAt ? Math.round((a.completedAt.getTime() - a.startedAt.getTime()) / 60000) : null,
    }))

    return NextResponse.json({
      success: true,
      attempts: data,
      count: data.length,
      pagination: { page, limit, totalCount: count, totalPages: Math.ceil(count / limit), hasNext: page * limit < count, hasPrev: page > 1 },
    })
  } catch (error) {
    console.error("Get exam results error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงประวัติการทำข้อสอบ" }, { status: 500 })
  }
}
