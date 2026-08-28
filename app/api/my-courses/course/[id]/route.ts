import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { resolveEnrollmentAccess } from "@/lib/enrollmentAccess"

// GET: /api/my-courses/course/[id] - full course detail (unlocked contents),
// gated by enrollment status/expiry when the caller has an enrollment.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true, description: true } },
        chapters: { include: { contents: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        enrollments: { where: { userId: user.userId } },
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
    })
    if (!course) return NextResponse.json({ success: false, error: "ไม่พบคอร์สนี้" }, { status: 404 })

    const enrollment = course.enrollments[0]
    let enrollmentInfo = null

    if (enrollment) {
      if (enrollment.status === "CANCELED") {
        return NextResponse.json({ success: false, error: "คอร์สนี้ถูกยกเลิกแล้ว", canceled: true }, { status: 403 })
      }
      const { expiresAt, isExpire } = resolveEnrollmentAccess(enrollment, course)
      if (isExpire) {
        return NextResponse.json({ success: false, error: "คอร์สหมดอายุแล้ว", isExpire: true, expiresAt: expiresAt.toISOString() }, { status: 403 })
      }
      enrollmentInfo = {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status,
        viewedContentIds: Array.isArray(enrollment.viewedContentIds) ? enrollment.viewedContentIds : [],
        expiresAt: expiresAt.toISOString(),
      }
    }

    const totalChapters = course.chapters.length
    const totalContents = course.chapters.reduce((sum, c) => sum + c.contents.length, 0)

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        duration: course.duration,
        isFree: course.isFree,
        status: course.status,
        coverImageUrl: course.coverImageUrl,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        instructor: course.instructor,
        category: course.category,
        chapters: course.chapters,
        stats: { totalChapters, totalContents, totalEnrollments: course._count.enrollments },
        enrollment: enrollmentInfo,
      },
    })
  } catch (error) {
    console.error("Get my-course detail error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอร์ส" }, { status: 500 })
  }
}
