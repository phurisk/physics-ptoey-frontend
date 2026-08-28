import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/categories - list all course categories
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงหมวดหมู่" }, { status: 500 })
  }
}

// POST: /api/admin/categories - create a category
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ success: false, error: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 })

    const category = await prisma.category.create({ data: { name: body.name, description: body.description } })
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่" }, { status: 400 })
  }
}
