import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { resolveEnrollmentAccess } from "@/lib/enrollmentAccess"

// GET: /api/my-courses - list the current user's enrolled courses
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, email: true } },
            category: { select: { id: true, name: true } },
            _count: { select: { chapters: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    if (enrollments.length === 0) {
      return NextResponse.json({ success: true, courses: [], count: 0, message: "No enrolled courses found" })
    }

    const courses = enrollments.map((enrollment) => {
      const { expiresAt, isExpire } = resolveEnrollmentAccess(enrollment, enrollment.course)
      return {
        ...enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        isExpire,
        expiresAt: expiresAt.toISOString(),
      }
    })

    return NextResponse.json({ success: true, courses, count: courses.length })
  } catch (error) {
    console.error("Get my-courses error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอร์สที่ลงทะเบียน" }, { status: 500 })
  }
}
