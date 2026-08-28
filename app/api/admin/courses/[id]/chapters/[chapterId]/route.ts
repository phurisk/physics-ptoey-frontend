import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/courses/[id]/chapters/[chapterId] - rename / reorder a chapter
export async function PUT(req: Request, { params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { chapterId } = await params
    const body = await req.json()

    const existing = await prisma.chapter.findUnique({ where: { id: chapterId } })
    if (!existing) return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: body.title ?? undefined,
        order: body.order != null ? Number(body.order) : undefined,
      },
    })
    return NextResponse.json({ success: true, data: chapter })
  } catch (error) {
    console.error("Update chapter error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขบทเรียน" }, { status: 400 })
  }
}

// DELETE: /api/admin/courses/[id]/chapters/[chapterId] - delete a chapter and its contents
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { chapterId } = await params
    const existing = await prisma.chapter.findUnique({ where: { id: chapterId } })
    if (!existing) return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })

    await prisma.$transaction([
      prisma.content.deleteMany({ where: { chapterId } }),
      prisma.chapter.delete({ where: { id: chapterId } }),
    ])
    return NextResponse.json({ success: true, message: "ลบบทเรียนสำเร็จ" })
  } catch (error) {
    console.error("Delete chapter error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบบทเรียน" }, { status: 400 })
  }
}
