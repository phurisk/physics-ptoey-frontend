import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/ebook-categories/[id] - update an ebook category
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (!body.name) return NextResponse.json({ success: false, error: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 })

    const category = await prisma.ebookCategory.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Update ebook category error:", error)
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่อีบุ๊ก" }, { status: 400 })
  }
}

// DELETE: /api/admin/ebook-categories/[id] - delete an ebook category
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const ebookCount = await prisma.ebook.count({ where: { categoryId: id } })
    if (ebookCount > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบได้ เนื่องจากมีอีบุ๊ก ${ebookCount} รายการอยู่ในหมวดหมู่นี้` },
        { status: 400 }
      )
    }
    await prisma.ebookCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete ebook category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบหมวดหมู่อีบุ๊ก" }, { status: 400 })
  }
}
