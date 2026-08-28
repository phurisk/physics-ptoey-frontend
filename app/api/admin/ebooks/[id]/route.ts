import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/ebooks/[id] - get a single ebook
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const ebook = await prisma.ebook.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { reviews: true, downloads: true } },
      },
    })
    if (!ebook) return NextResponse.json({ success: false, error: "Ebook not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: ebook })
  } catch (error) {
    console.error("Get ebook error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลอีบุ๊ก" }, { status: 500 })
  }
}

// PUT: /api/admin/ebooks/[id] - update an ebook
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existingEbook = await prisma.ebook.findUnique({ where: { id } })
    if (!existingEbook) return NextResponse.json({ success: false, error: "Ebook not found" }, { status: 404 })

    const ebook = await prisma.ebook.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        author: body.author,
        isbn: body.isbn || null,
        price: parseFloat(body.price) || 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        coverImageUrl: body.coverImageUrl || null,
        previewUrl: body.previewUrl || null,
        fileUrl: body.fileUrl || null,
        fileSize: body.fileSize ? parseInt(body.fileSize) : null,
        pageCount: body.pageCount ? parseInt(body.pageCount) : null,
        language: body.language || "th",
        format: body.format || "PDF",
        isPhysical: !!body.isPhysical,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions || null,
        downloadLimit: body.downloadLimit ? parseInt(body.downloadLimit) : null,
        accessDuration: body.accessDuration ? parseInt(body.accessDuration) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        isFeatured: !!body.isFeatured,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        publishedYear: body.publishedYear ? parseInt(body.publishedYear) : null,
        categoryId: body.categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: ebook })
  } catch (error) {
    console.error("Update ebook error:", error)
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, error: "ISBN นี้มีอยู่แล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขอีบุ๊ก" }, { status: 400 })
  }
}

// DELETE: /api/admin/ebooks/[id] - delete an ebook
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const ebook = await tx.ebook.findUnique({ where: { id }, include: { downloads: true } })
      if (!ebook) throw new Error("Ebook not found")

      if (ebook.downloads.length > 0) {
        throw new Error(`ไม่สามารถลบอีบุ๊กได้ เนื่องจากมีการดาวน์โหลดแล้ว ${ebook.downloads.length} ครั้ง`)
      }
      const orderItemCount = await tx.orderItem.count({ where: { itemType: "EBOOK", itemId: id } })
      if (orderItemCount > 0) {
        throw new Error(`ไม่สามารถลบอีบุ๊กได้ เนื่องจากมีคำสั่งซื้อ ${orderItemCount} รายการอ้างอิงอยู่`)
      }

      await tx.ebook.delete({ where: { id } })

      return { id: ebook.id, title: ebook.title }
    })

    return NextResponse.json({ success: true, message: "ลบอีบุ๊กสำเร็จ", data: result })
  } catch (error) {
    console.error("Delete ebook error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบอีบุ๊ก" },
      { status: 400 }
    )
  }
}
