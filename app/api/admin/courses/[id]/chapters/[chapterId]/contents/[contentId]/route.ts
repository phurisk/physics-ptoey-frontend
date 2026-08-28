import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/courses/[id]/chapters/[chapterId]/contents/[contentId] - update content
export async function PUT(req: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { contentId } = await params
    const body = await req.json()

    const existing = await prisma.content.findUnique({ where: { id: contentId } })
    if (!existing) return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 })

    const content = await prisma.content.update({
      where: { id: contentId },
      data: {
        title: body.title ?? undefined,
        contentType: body.contentType ?? undefined,
        contentUrl: body.contentUrl ?? undefined,
        order: body.order != null ? Number(body.order) : undefined,
      },
    })
    return NextResponse.json({ success: true, data: content })
  } catch (error) {
    console.error("Update content error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขเนื้อหา" }, { status: 400 })
  }
}

// DELETE: /api/admin/courses/[id]/chapters/[chapterId]/contents/[contentId] - delete content
export async function DELETE(_req: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { contentId } = await params
    const existing = await prisma.content.findUnique({ where: { id: contentId } })
    if (!existing) return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 })

    await prisma.content.delete({ where: { id: contentId } })
    return NextResponse.json({ success: true, message: "ลบเนื้อหาสำเร็จ" })
  } catch (error) {
    console.error("Delete content error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบเนื้อหา" }, { status: 400 })
  }
}
