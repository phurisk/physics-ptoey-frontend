import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/mock-topics - list topics
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const search = searchParams.get("search") || ""
    const subject = searchParams.get("subject") || ""

    const where: Prisma.MockTopicWhereInput = {}
    if (search) where.name = { contains: search, mode: "insensitive" }
    if (subject) where.subject = subject as Prisma.MockTopicWhereInput["subject"]

    const [totalCount, topics] = await Promise.all([
      prisma.mockTopic.count({ where }),
      prisma.mockTopic.findMany({
        where,
        include: { _count: { select: { questions: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: topics,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (error) {
    console.error("Get mock topics error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลหัวข้อ" }, { status: 500 })
  }
}

// POST: /api/admin/mock-topics - create a topic
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.subject || !body.name) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const existing = await prisma.mockTopic.findUnique({
      where: { subject_name: { subject: body.subject, name: body.name } },
    })
    if (existing) return NextResponse.json({ success: false, error: "มีหัวข้อนี้ในวิชานี้อยู่แล้ว" }, { status: 400 })

    const topic = await prisma.mockTopic.create({ data: { subject: body.subject, name: body.name } })
    return NextResponse.json({ success: true, data: topic })
  } catch (error) {
    console.error("Create mock topic error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างหัวข้อ" }, { status: 400 })
  }
}
