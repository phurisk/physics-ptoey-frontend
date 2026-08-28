import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/enrollments?courseId=xxx - the current user's enrollment for a course
// (used by the course player to restore per-lesson viewed-state)
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const courseId = url.searchParams.get("courseId")
  if (!courseId) return NextResponse.json({ success: false, error: "courseId is required" }, { status: 400 })

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.userId, courseId } },
    })
    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error("Get enrollment error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch enrollment" }, { status: 500 })
  }
}

// PATCH: /api/enrollments - update the current user's progress on a course
// (viewedContentIds drives progress %; content that no longer exists is dropped)
export async function PATCH(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const courseId = body?.courseId as string | undefined
    const viewedContentIds = Array.isArray(body?.viewedContentIds) ? (body.viewedContentIds as string[]) : null
    if (!courseId || !viewedContentIds) {
      return NextResponse.json({ success: false, error: "courseId and viewedContentIds are required" }, { status: 400 })
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.userId, courseId } },
    })
    if (!existing) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    const totalContents = await prisma.content.count({ where: { chapter: { courseId } } })
    const progress = totalContents > 0 ? Math.min(1, viewedContentIds.length / totalContents) : 0
    const status = progress >= 1 ? "COMPLETED" : existing.status === "COMPLETED" ? "ACTIVE" : existing.status

    const enrollment = await prisma.enrollment.update({
      where: { id: existing.id },
      data: { viewedContentIds, progress, status },
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error("Update enrollment error:", error)
    return NextResponse.json({ success: false, error: "Failed to update enrollment" }, { status: 500 })
  }
}

// POST: /api/enrollments - idempotent manual-enroll fallback (e.g. free courses,
// or a safety net if order-fulfillment's grantEntitlementsForOrder was missed).
// Requires the course to actually be free, or the order to be a completed
// purchase of this course for the same user — never grants access for free.
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const courseId = body?.courseId as string | undefined
    const orderId = body?.orderId as string | undefined
    if (!courseId) return NextResponse.json({ success: false, error: "courseId is required" }, { status: 400 })

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.userId, courseId } },
    })
    if (existing) return NextResponse.json({ success: true, enrollment: existing })

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })

    const isFreeCourse = course.isFree || (course.price ?? 0) === 0
    let allowed = isFreeCourse

    if (!allowed && orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
      allowed = !!(
        order &&
        order.userId === user.userId &&
        order.status === "COMPLETED" &&
        order.items.some((item) => item.itemType === "COURSE" && item.itemId === courseId)
      )
    }

    if (!allowed) return NextResponse.json({ success: false, error: "Not entitled to enroll in this course" }, { status: 403 })

    const enrollment = await prisma.enrollment.create({
      data: { userId: user.userId, courseId, status: "ACTIVE" },
    })
    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error("Create enrollment error:", error)
    return NextResponse.json({ success: false, error: "Failed to create enrollment" }, { status: 500 })
  }
}
