import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/courses/[id] - get a single course
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        chapters: { include: { contents: true }, orderBy: { order: "asc" } },
      },
    })
    if (!course) return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("Get course error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลคอร์ส" }, { status: 500 })
  }
}

// PUT: /api/admin/courses/[id] - update a course
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existingCourse = await prisma.course.findUnique({ where: { id } })
    if (!existingCourse) return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })

    const course = await prisma.course.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        price: parseFloat(body.price) || 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        sampleVideo: body.sampleVideo,
        duration: body.duration,
        accessDuration: body.accessDuration,
        accessHours: body.accessHours,
        isFree: !!body.isFree,
        isRecommended: !!body.isRecommended,
        status: body.status,
        instructorId: body.instructorId,
        categoryId: body.categoryId || null,
        subject: body.subject || null,
        gradeLevel: body.gradeLevel || null,
        coverImageUrl: body.coverImageUrl,
        coverPublicId: body.coverPublicId,
        isPhysical: !!body.isPhysical,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions,
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error("Update course error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขคอร์ส" }, { status: 400 })
  }
}

// DELETE: /api/admin/courses/[id] - delete a course and its chapters/contents
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id },
        include: { chapters: { include: { contents: true } }, enrollments: true },
      })
      if (!course) throw new Error("Course not found")

      if (course.enrollments.length > 0) {
        throw new Error(`ไม่สามารถลบคอร์สได้ เนื่องจากมีผู้ลงทะเบียนแล้ว ${course.enrollments.length} คน`)
      }
      const orderItemCount = await tx.orderItem.count({ where: { itemType: "COURSE", itemId: id } })
      if (orderItemCount > 0) {
        throw new Error(`ไม่สามารถลบคอร์สได้ เนื่องจากมีคำสั่งซื้อ ${orderItemCount} รายการอ้างอิงอยู่`)
      }

      for (const chapter of course.chapters) {
        if (chapter.contents.length > 0) {
          await tx.content.deleteMany({ where: { chapterId: chapter.id } })
        }
      }
      if (course.chapters.length > 0) {
        await tx.chapter.deleteMany({ where: { courseId: id } })
      }
      await tx.course.delete({ where: { id } })

      return { id: course.id, title: course.title }
    })

    return NextResponse.json({ success: true, message: "ลบคอร์สสำเร็จ", data: result })
  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบคอร์ส" },
      { status: 400 }
    )
  }
}
