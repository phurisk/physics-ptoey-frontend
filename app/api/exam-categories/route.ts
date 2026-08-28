import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/exam-categories?includeExams=true - exam-bank categories, public
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const includeExams = searchParams.get("includeExams") === "true"

    const categories = await prisma.examCategory.findMany({
      where: { isActive: true },
      include: {
        ...(includeExams && {
          exams: {
            where: { isActive: true },
            include: { _count: { select: { files: true } } },
            orderBy: { createdAt: "desc" },
          },
        }),
        _count: { select: { exams: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("Get exam categories error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่ข้อสอบ" }, { status: 500 })
  }
}
