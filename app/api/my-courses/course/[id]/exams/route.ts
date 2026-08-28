import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { resolveEnrollmentAccess } from "@/lib/enrollmentAccess"

// GET: /api/my-courses/course/[id]/exams - list exams for an enrolled course
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: courseId } = await params

    const enrollment = await prisma.enrollment.findFirst({ where: { userId: user.userId, courseId, status: "ACTIVE" } })
    if (!enrollment) return NextResponse.json({ success: false, error: "คุณยังไม่ได้ลงทะเบียนคอร์สนี้" }, { status: 403 })

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (course) {
      const { isExpire } = resolveEnrollmentAccess(enrollment, course)
      if (isExpire) return NextResponse.json({ success: false, error: "คอร์สหมดอายุแล้ว" }, { status: 403 })
    }

    const exams = await prisma.exam.findMany({
      where: { courseId, isActive: true },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true } },
        attempts: { where: { userId: user.userId }, select: { id: true, status: true, percentage: true, passed: true, completedAt: true, startedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const data = exams.map((exam) => {
      const attempt = exam.attempts[0]
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        duration: exam.timeLimit,
        course: exam.course,
        totalQuestions: exam._count.questions,
        status: attempt ? attempt.status : "NOT_STARTED",
        canRetake: !attempt || attempt.status !== "COMPLETED",
        lastAttempt: attempt || null,
        createdAt: exam.createdAt,
      }
    })

    return NextResponse.json({ success: true, exams: data, count: data.length })
  } catch (error) {
    console.error("Get course exams error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบ" }, { status: 500 })
  }
}
