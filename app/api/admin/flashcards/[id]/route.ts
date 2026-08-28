import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { validateAnswerModeFields } from "@/lib/flashcardValidation"

// PUT: /api/admin/flashcards/[id] - update a card, fully replacing its options
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.flashcard.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบการ์ด" }, { status: 404 })

    const mode = body.answerMode || "SELF_GRADE"
    const validationError = validateAnswerModeFields({ answerMode: mode, options: body.options, acceptedAnswers: body.acceptedAnswers })
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 })

    const card = await prisma.$transaction(async (tx) => {
      await tx.flashcardOption.deleteMany({ where: { cardId: id } })
      return tx.flashcard.update({
        where: { id },
        data: {
          front: body.front,
          frontImage: body.frontImage || null,
          back: body.back,
          backImage: body.backImage || null,
          hint: body.hint || null,
          answerMode: mode,
          acceptedAnswers: mode === "TYPED" ? (body.acceptedAnswers || []).filter((a: string) => a && a.trim()) : [],
          numericTolerance: mode === "TYPED" && body.numericTolerance !== "" && body.numericTolerance != null ? parseFloat(body.numericTolerance) : null,
          options:
            mode === "MULTIPLE_CHOICE" && body.options?.length
              ? { create: body.options.map((o: { optionText: string; isCorrect?: boolean }, idx: number) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect, order: idx })) }
              : undefined,
        },
        include: { options: { orderBy: { order: "asc" } } },
      })
    })

    return NextResponse.json({ success: true, data: card })
  } catch (error) {
    console.error("Update flashcard error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขการ์ด" }, { status: 400 })
  }
}

// DELETE: /api/admin/flashcards/[id] - delete a card (blocked if reviewed by any student)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const card = await prisma.flashcard.findUnique({ where: { id }, include: { _count: { select: { reviews: true } } } })
    if (!card) return NextResponse.json({ success: false, error: "ไม่พบการ์ด" }, { status: 404 })
    if (card._count.reviews > 0) {
      return NextResponse.json({ success: false, error: "ไม่สามารถลบได้ เนื่องจากมีนักเรียนทบทวนการ์ดนี้แล้ว" }, { status: 400 })
    }

    await prisma.flashcard.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "ลบการ์ดสำเร็จ" })
  } catch (error) {
    console.error("Delete flashcard error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบการ์ด" }, { status: 400 })
  }
}
