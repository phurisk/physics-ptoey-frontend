import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/ebook-categories - active ebook categories, public, no pagination
export async function GET() {
  try {
    const categories = await prisma.ebookCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { ebooks: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("Get ebook categories error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" }, { status: 500 })
  }
}
