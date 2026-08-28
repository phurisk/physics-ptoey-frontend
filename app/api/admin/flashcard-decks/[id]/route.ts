import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/flashcard-decks/[id] - get a single deck
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id },
      include: { topic: true, _count: { select: { cards: true } } },
    })
    if (!deck) return NextResponse.json({ success: false, error: "ไม่พบชุดแฟลชการ์ด" }, { status: 404 })

    return NextResponse.json({ success: true, data: deck })
  } catch (error) {
    console.error("Get flashcard deck error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลชุดแฟลชการ์ด" }, { status: 500 })
  }
}

// PUT: /api/admin/flashcard-decks/[id] - update a deck
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.flashcardDeck.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบชุดแฟลชการ์ด" }, { status: 404 })
    if (body.topicId) {
      const topic = await prisma.mockTopic.findUnique({ where: { id: body.topicId } })
      if (!topic) return NextResponse.json({ success: false, error: "ไม่พบหัวข้อที่เลือก" }, { status: 400 })
    }

    const deck = await prisma.flashcardDeck.update({
      where: { id },
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
    console.error("Update flashcard deck error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขชุดแฟลชการ์ด" }, { status: 400 })
  }
}

// DELETE: /api/admin/flashcard-decks/[id] - delete a deck (blocked if any card
// has been reviewed by a student; deactivate instead in that case).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const deck = await prisma.flashcardDeck.findUnique({ where: { id } })
    if (!deck) return NextResponse.json({ success: false, error: "ไม่พบชุดแฟลชการ์ด" }, { status: 404 })

    const reviewCount = await prisma.flashcardReview.count({ where: { card: { deckId: id } } })
    if (reviewCount > 0) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีนักเรียนทบทวนการ์ดในชุดนี้แล้ว กรุณาปิดใช้งานแทน" },
        { status: 400 }
      )
    }

    await prisma.flashcardDeck.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบชุดแฟลชการ์ดสำเร็จ" })
  } catch (error) {
    console.error("Delete flashcard deck error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบชุดแฟลชการ์ด" }, { status: 400 })
  }
}
