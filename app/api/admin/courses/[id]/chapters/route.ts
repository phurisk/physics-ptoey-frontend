import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/courses/[id]/chapters - list chapters (with contents) for a course
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: courseId } = await params
    const chapters = await prisma.chapter.findMany({
      where: { courseId },
      include: { contents: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    })
    return NextResponse.json({ success: true, data: chapters })
  } catch (error) {
    console.error("Get chapters error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลบทเรียน" }, { status: 500 })
  }
}

// POST: /api/admin/courses/[id]/chapters - create a chapter (appended to the end)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: courseId } = await params
    const body = await req.json()
    if (!body.title) return NextResponse.json({ success: false, error: "กรุณากรอกชื่อบทเรียน" }, { status: 400 })

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })

    const maxOrder = await prisma.chapter.aggregate({ where: { courseId }, _max: { order: true } })
    const chapter = await prisma.chapter.create({
      data: { title: body.title, courseId, order: (maxOrder._max.order ?? 0) + 1 },
      include: { contents: true },
    })
    return NextResponse.json({ success: true, data: chapter })
  } catch (error) {
    console.error("Create chapter error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างบทเรียน" }, { status: 400 })
  }
}
