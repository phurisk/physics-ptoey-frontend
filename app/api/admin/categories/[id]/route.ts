import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/categories/[id] - update a category
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const category = await prisma.category.update({
      where: { id },
      data: { name: body.name, description: body.description },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่" }, { status: 400 })
  }
}

// DELETE: /api/admin/categories/[id] - delete a category
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const courseCount = await prisma.course.count({ where: { categoryId: id } })
    if (courseCount > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบได้ เนื่องจากมีคอร์ส ${courseCount} รายการอยู่ในหมวดหมู่นี้` },
        { status: 400 }
      )
    }
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบหมวดหมู่" }, { status: 400 })
  }
}
