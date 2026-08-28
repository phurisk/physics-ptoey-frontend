import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/flashcard-decks - list decks
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const search = searchParams.get("search") || ""
    const subject = searchParams.get("subject") || ""
    const gradeLevel = searchParams.get("gradeLevel") || ""
    const status = searchParams.get("status") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

    const where: Prisma.FlashcardDeckWhereInput = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (subject) where.subject = subject as Prisma.FlashcardDeckWhereInput["subject"]
    if (gradeLevel) where.gradeLevel = gradeLevel as Prisma.FlashcardDeckWhereInput["gradeLevel"]
    if (status === "active") where.isActive = true
    if (status === "inactive") where.isActive = false

    const [totalCount, decks] = await Promise.all([
      prisma.flashcardDeck.count({ where }),
      prisma.flashcardDeck.findMany({
        where,
        include: { topic: { select: { id: true, name: true } }, _count: { select: { cards: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: decks,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (error) {
    console.error("Get flashcard decks error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลชุดแฟลชการ์ด" }, { status: 500 })
  }
}

// POST: /api/admin/flashcard-decks - create a deck
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.title || !body.subject) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }
    if (body.topicId) {
      const topic = await prisma.mockTopic.findUnique({ where: { id: body.topicId } })
      if (!topic) return NextResponse.json({ success: false, error: "ไม่พบหัวข้อที่เลือก" }, { status: 400 })
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        title: body.title,
        description: body.description || null,
        subject: body.subject,
        gradeLevel: body.gradeLevel || null,
        topicId: body.topicId || null,
        coverImageUrl: body.coverImageUrl || null,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ success: true, data: deck })
  } catch (error) {
    console.error("Create flashcard deck error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างชุดแฟลชการ์ด" }, { status: 400 })
  }
}
