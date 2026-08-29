import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/mock-exams/[id] - get a single mock exam with its questions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const exam = await prisma.mockExam.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          include: { options: { orderBy: { order: "asc" } }, topic: true, _count: { select: { answers: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { questions: true, attempts: true } },
      },
    })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบจำลอง" }, { status: 404 })

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Get mock exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลข้อสอบจำลอง" }, { status: 500 })
  }
}

// PUT: /api/admin/mock-exams/[id] - update a mock exam
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.mockExam.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบจำลอง" }, { status: 404 })

    const allowPracticeMode = body.allowPracticeMode ?? true
    const allowRealMode = body.allowRealMode ?? true
    if (!allowPracticeMode && !allowRealMode) {
      return NextResponse.json({ success: false, error: "ต้องเปิดโหมดฝึกซ้อมหรือโหมดสอบจริงอย่างน้อยหนึ่งโหมด" }, { status: 400 })
    }
    if (body.courseId) {
      const course = await prisma.course.findUnique({ where: { id: body.courseId } })
      if (!course) return NextResponse.json({ success: false, error: "ไม่พบคอร์สที่เลือก" }, { status: 400 })
    }

    const exam = await prisma.mockExam.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description || null,
        courseId: body.courseId || null,
        subject: body.subject,
        gradeLevel: body.gradeLevel || null,
        timeLimit: body.timeLimit ? parseInt(body.timeLimit, 10) : null,
        price: body.price ? parseFloat(body.price) : 0,
        discountPrice: body.discountPrice ? parseFloat(body.discountPrice) : null,
        passingMarks: body.passingMarks ? parseInt(body.passingMarks, 10) : 0,
        attemptsAllowed: body.attemptsAllowed ? parseInt(body.attemptsAllowed, 10) : 1,
        allowPracticeMode,
        allowRealMode,
        practiceUnlockCost: body.practiceUnlockCost ? parseInt(body.practiceUnlockCost, 10) : 1,
        isActive: body.isActive ?? true,
        examPdfUrl: body.examPdfUrl || null,
      },
    })
    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error("Update mock exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขข้อสอบจำลอง" }, { status: 400 })
  }
}

// DELETE: /api/admin/mock-exams/[id] - delete a mock exam (blocked if students have taken it)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const exam = await prisma.mockExam.findUnique({ where: { id }, include: { _count: { select: { attempts: true } } } })
    if (!exam) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบจำลอง" }, { status: 404 })
    if (exam._count.attempts > 0) {
      return NextResponse.json({ success: false, error: `ไม่สามารถลบได้ เนื่องจากมีนักเรียนทำข้อสอบนี้แล้ว ${exam._count.attempts} ครั้ง` }, { status: 400 })
    }

    await prisma.mockExam.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบข้อสอบจำลองสำเร็จ" })
  } catch (error) {
    console.error("Delete mock exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบข้อสอบจำลอง" }, { status: 400 })
  }
}
