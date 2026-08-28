import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/mock-topics/[id] - update a topic
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (!body.subject || !body.name) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const dup = await prisma.mockTopic.findUnique({ where: { subject_name: { subject: body.subject, name: body.name } } })
    if (dup && dup.id !== id) return NextResponse.json({ success: false, error: "มีหัวข้อนี้ในวิชานี้อยู่แล้ว" }, { status: 400 })

    const topic = await prisma.mockTopic.update({ where: { id }, data: { subject: body.subject, name: body.name } })
    return NextResponse.json({ success: true, data: topic })
  } catch (error) {
    console.error("Update mock topic error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขหัวข้อ" }, { status: 400 })
  }
}

// DELETE: /api/admin/mock-topics/[id] - delete a topic (blocked if it has questions)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const topic = await prisma.mockTopic.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } })
    if (!topic) return NextResponse.json({ success: false, error: "ไม่พบหัวข้อ" }, { status: 404 })
    if (topic._count.questions > 0) {
      return NextResponse.json({ success: false, error: `ไม่สามารถลบได้ เนื่องจากมีคำถามผูกอยู่ ${topic._count.questions} ข้อ` }, { status: 400 })
    }

    await prisma.mockTopic.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบหัวข้อสำเร็จ" })
  } catch (error) {
    console.error("Delete mock topic error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบหัวข้อ" }, { status: 400 })
  }
}
