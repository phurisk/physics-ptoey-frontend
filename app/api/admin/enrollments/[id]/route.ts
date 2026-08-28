import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/enrollments/[id] - get a single enrollment
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, accessDuration: true, accessHours: true } },
      },
    })
    if (!enrollment) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: enrollment })
  } catch (error) {
    console.error("Get enrollment error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลการลงทะเบียน" }, { status: 500 })
  }
}

// PUT: /api/admin/enrollments/[id] - update status / per-user access overrides
// (admins don't create enrollments manually — those come from order fulfillment
// or the student's own free-course enroll — only status/access can be adjusted here)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.enrollment.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        accessDuration: body.accessDuration === "" ? null : body.accessDuration != null ? Number(body.accessDuration) : undefined,
        accessHours: body.accessHours === "" ? null : body.accessHours != null ? Number(body.accessHours) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ success: true, data: enrollment })
  } catch (error) {
    console.error("Update enrollment error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขการลงทะเบียน" }, { status: 400 })
  }
}

// DELETE: /api/admin/enrollments/[id] - revoke an enrollment (e.g. refund, mistaken enroll)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const existing = await prisma.enrollment.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 })

    await prisma.enrollment.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ยกเลิกการลงทะเบียนสำเร็จ" })
  } catch (error) {
    console.error("Delete enrollment error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการยกเลิกการลงทะเบียน" }, { status: 400 })
  }
}
