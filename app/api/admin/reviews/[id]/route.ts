import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// DELETE: /api/admin/reviews/[id] - moderate by removing an inappropriate review.
// Admins only delete reviews; they never edit a user's own review content.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 })

    await prisma.review.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "ลบรีวิวสำเร็จ", data: { id } })
  } catch (error) {
    console.error("Delete review error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบรีวิว" }, { status: 400 })
  }
}
