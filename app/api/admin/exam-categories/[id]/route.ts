import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/exam-categories/[id] - get a single exam category
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const category = await prisma.examCategory.findUnique({
      where: { id },
      include: {
        exams: { include: { _count: { select: { files: true } } } },
        _count: { select: { exams: true } },
      },
    })
    if (!category) return NextResponse.json({ success: false, error: "ไม่พบหมวดหมู่ข้อสอบ" }, { status: 404 })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Get exam category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ข้อสอบ" }, { status: 500 })
  }
}

// PUT: /api/admin/exam-categories/[id] - update an exam category
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ success: false, error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 })
    }

    const existingCategory = await prisma.examCategory.findUnique({ where: { id } })
    if (!existingCategory) return NextResponse.json({ success: false, error: "ไม่พบหมวดหมู่ข้อสอบ" }, { status: 404 })

    const duplicate = await prisma.examCategory.findFirst({ where: { name: body.name, id: { not: id } } })
    if (duplicate) {
      return NextResponse.json({ success: false, error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" }, { status: 400 })
    }

    const category = await prisma.examCategory.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        isActive: body.isActive ?? existingCategory.isActive,
      },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Update exam category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่ข้อสอบ" }, { status: 400 })
  }
}

// DELETE: /api/admin/exam-categories/[id] - delete an exam category
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const category = await prisma.examCategory.findUnique({
      where: { id },
      include: { _count: { select: { exams: true } } },
    })
    if (!category) return NextResponse.json({ success: false, error: "ไม่พบหมวดหมู่ข้อสอบ" }, { status: 404 })

    if (category._count.exams > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบหมวดหมู่ที่มีข้อสอบอยู่ได้ (${category._count.exams} รายการ)` },
        { status: 400 }
      )
    }

    await prisma.examCategory.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบหมวดหมู่ข้อสอบสำเร็จ" })
  } catch (error) {
    console.error("Delete exam category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบหมวดหมู่ข้อสอบ" }, { status: 400 })
  }
}
