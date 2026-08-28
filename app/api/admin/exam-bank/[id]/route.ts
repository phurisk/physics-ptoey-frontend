import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/exam-bank/[id] - get a single exam bank entry
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const exam = await prisma.examBank.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        files: { orderBy: { uploadedAt: "desc" } },
      },
    })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Get exam bank entry error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบ" }, { status: 500 })
  }
}

// PUT: /api/admin/exam-bank/[id] - update an exam bank entry
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (!body.title) {
      return NextResponse.json({ success: false, error: "กรุณาระบุชื่อข้อสอบ" }, { status: 400 })
    }

    const existingExam = await prisma.examBank.findUnique({ where: { id } })
    if (!existingExam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    if (body.categoryId) {
      const category = await prisma.examCategory.findUnique({ where: { id: body.categoryId } })
      if (!category) return NextResponse.json({ success: false, error: "ไม่พบหมวดหมู่ที่ระบุ" }, { status: 400 })
    }

    const exam = await prisma.examBank.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        categoryId: body.categoryId || null,
        isActive: body.isActive ?? existingExam.isActive,
      },
      include: {
        category: { select: { id: true, name: true } },
        files: { orderBy: { uploadedAt: "desc" } },
      },
    })
    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Update exam bank entry error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อสอบ" }, { status: 400 })
  }
}

// DELETE: /api/admin/exam-bank/[id] - delete an exam bank entry (files cascade)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const exam = await prisma.examBank.findUnique({ where: { id } })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    // ไฟล์ในข้อสอบนี้จะถูกลบอัตโนมัติเนื่องจาก onDelete: Cascade บน ExamFile
    await prisma.examBank.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "ลบข้อสอบสำเร็จ" })
  } catch (error) {
    console.error("Delete exam bank entry error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบข้อสอบ" }, { status: 400 })
  }
}
