import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/ebooks/[id] - active ebook detail, public
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const ebook = await prisma.ebook.findUnique({
      where: { id, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        reviews: { where: { isActive: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        _count: { select: { reviews: true } },
      },
    })

    if (!ebook) {
      return NextResponse.json({ success: false, error: "Ebook not found" }, { status: 404 })
    }

    const averageRating = ebook.reviews.length > 0 ? ebook.reviews.reduce((s, r) => s + r.rating, 0) / ebook.reviews.length : 0

    return NextResponse.json({ success: true, data: { ...ebook, fileUrl: undefined, averageRating } })
  } catch (error) {
    console.error("Get ebook error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลอีบุ๊ก" }, { status: 500 })
  }
}
