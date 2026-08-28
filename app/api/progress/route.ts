import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

type ViewedContentIds = string[]

function asViewedIds(value: unknown): ViewedContentIds {
  return Array.isArray(value) ? (value as ViewedContentIds) : []
}

// GET: /api/progress?courseId=... - read progress, self-healing against stale content ids
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    if (!courseId) return NextResponse.json({ success: false, error: "Missing courseId" }, { status: 400 })

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.userId, courseId } },
      include: { course: { select: { title: true, chapters: { include: { contents: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } } } },
    })
    if (!enrollment) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    const courseContentIds = enrollment.course.chapters.flatMap((c) => c.contents.map((ct) => ct.id))
    const totalContents = courseContentIds.length
    const viewedContentIds = asViewedIds(enrollment.viewedContentIds)
    const validViewedIds = viewedContentIds.filter((id) => courseContentIds.includes(id))

    const progress =
      validViewedIds.length > 0 && totalContents > 0
        ? Math.round((validViewedIds.length / totalContents) * 100)
        : Math.min(100, Math.max(0, enrollment.progress))

    const completedContents = validViewedIds.length > 0 ? validViewedIds.length : Math.round((progress / 100) * totalContents)

    return NextResponse.json({
      success: true,
      data: {
        progress,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        totalContents,
        completedContents,
        courseTitle: enrollment.course.title,
        viewedContentIds: validViewedIds,
      },
    })
  } catch (error) {
    console.error("Get progress error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลความคืบหน้า" }, { status: 500 })
  }
}

// PUT: /api/progress - reset/set progress directly, wipes viewedContentIds
export async function PUT(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { courseId, progress = 0 } = body

    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.userId, courseId } } })
    if (!enrollment) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    const clamped = Math.min(100, Math.max(0, progress))
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progress: clamped, status: clamped >= 100 ? "COMPLETED" : "ACTIVE", viewedContentIds: [] },
    })

    return NextResponse.json({ success: true, progress: clamped, status: clamped >= 100 ? "COMPLETED" : "ACTIVE", viewedContentIds: [], message: "Progress reset" })
  } catch (error) {
    console.error("Reset progress error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการรีเซ็ตความคืบหน้า" }, { status: 500 })
  }
}
