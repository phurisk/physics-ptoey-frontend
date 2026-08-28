import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// POST: /api/update-progress - mark one content item viewed (incremental progress)
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { courseId, contentId } = body
    if (!courseId || !contentId) {
      return NextResponse.json({ success: false, error: "Missing courseId or contentId" }, { status: 400 })
    }

    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.userId, courseId } } })
    if (!enrollment) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { chapters: { include: { contents: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    })
    if (!course) return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })

    const contentIds = course.chapters.flatMap((c) => c.contents.map((ct) => ct.id))
    if (contentIds.length === 0) return NextResponse.json({ success: false, error: "No contents found in course" }, { status: 400 })
    if (!contentIds.includes(contentId)) return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 })

    const currentViewed = Array.isArray(enrollment.viewedContentIds) ? (enrollment.viewedContentIds as string[]) : []
    const nextViewedSet = new Set([...currentViewed.filter((id) => contentIds.includes(id)), contentId])
    const viewedList = contentIds.filter((id) => nextViewedSet.has(id))

    const totalContents = contentIds.length
    const progress = Math.round((viewedList.length / totalContents) * 100)
    const status = progress >= 100 ? "COMPLETED" : "ACTIVE"

    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { viewedContentIds: viewedList, progress, status } })

    return NextResponse.json({
      success: true,
      progress,
      status,
      viewedContentIds: viewedList,
      data: { progress, status, viewedContentIds: viewedList },
      message: "Progress updated",
    })
  } catch (error) {
    console.error("Update progress error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัพเดทความคืบหน้า" }, { status: 500 })
  }
}
