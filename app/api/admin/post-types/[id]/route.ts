import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// PUT: /api/admin/post-types/[id] - update a post type
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.postType.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบประเภทบทความ" }, { status: 404 })

    if (!body.name) {
      return NextResponse.json({ success: false, error: "กรุณากรอกชื่อประเภทบทความ" }, { status: 400 })
    }

    const postType = await prisma.postType.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ success: true, data: postType })
  } catch (error: unknown) {
    console.error("Update post type error:", error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "มีประเภทบทความชื่อนี้อยู่แล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขประเภทบทความ" }, { status: 400 })
  }
}

// DELETE: /api/admin/post-types/[id] - delete a post type (blocked if posts still reference it)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const existing = await prisma.postType.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบประเภทบทความ" }, { status: 404 })

    const postCount = await prisma.post.count({ where: { postTypeId: id } })
    if (postCount > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบประเภทบทความได้ เนื่องจากมีบทความ ${postCount} รายการอ้างอิงอยู่` },
        { status: 400 }
      )
    }

    await prisma.postType.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบประเภทบทความสำเร็จ", data: { id: existing.id, name: existing.name } })
  } catch (error) {
    console.error("Delete post type error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบประเภทบทความ" }, { status: 400 })
  }
}
