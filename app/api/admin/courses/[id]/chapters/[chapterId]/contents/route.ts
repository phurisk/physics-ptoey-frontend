import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// POST: /api/admin/courses/[id]/chapters/[chapterId]/contents - add content (appended to the end)
export async function POST(req: Request, { params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { chapterId } = await params
    const body = await req.json()
    if (!body.title || !body.contentType || !body.contentUrl) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
    if (!chapter) return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 })

    const maxOrder = await prisma.content.aggregate({ where: { chapterId }, _max: { order: true } })
    const content = await prisma.content.create({
      data: {
        title: body.title,
        contentType: body.contentType,
        contentUrl: body.contentUrl,
        chapterId,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    })
    return NextResponse.json({ success: true, data: content })
  } catch (error) {
    console.error("Create content error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างเนื้อหา" }, { status: 400 })
  }
}
