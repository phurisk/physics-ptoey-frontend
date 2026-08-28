import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/courses/[id] - published course detail, public.
// Content bodies/URLs are intentionally omitted here (locked-content teaser
// pattern) — only title/type/order. Full contents are served via
// /api/my-courses/course/[id] once the caller is enrolled.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const course = await prisma.course.findUnique({
      where: { id, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        discountPrice: true,
        sampleVideo: true,
        duration: true,
        accessDuration: true,
        accessHours: true,
        isFree: true,
        isRecommended: true,
        status: true,
        coverImageUrl: true,
        coverPublicId: true,
        isPhysical: true,
        weight: true,
        dimensions: true,
        createdAt: true,
        updatedAt: true,
        instructor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, description: true } },
        chapters: {
          select: { id: true, title: true, order: true, contents: { select: { id: true, title: true, contentType: true, order: true }, orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ success: false, error: "ไม่พบคอร์สที่ระบุ" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("Get course error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอร์ส" }, { status: 500 })
  }
}
