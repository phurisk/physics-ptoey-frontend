import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { applyReview } from "@/lib/sm2"

const VALID_ANSWER_MODES = ["SELF_GRADE", "MULTIPLE_CHOICE", "TYPED"]

// POST: /api/flashcards/review - record one card review and advance its SM-2 state
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const { cardId, grade, answerMode, userAnswer } = body || {}

    if (!cardId) return NextResponse.json({ success: false, error: "cardId is required" }, { status: 400 })
    if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
      return NextResponse.json({ success: false, error: "grade must be an integer 0-5" }, { status: 400 })
    }
    if (!VALID_ANSWER_MODES.includes(answerMode)) {
      return NextResponse.json({ success: false, error: "invalid answerMode" }, { status: 400 })
    }

    const card = await prisma.flashcard.findUnique({ where: { id: cardId }, include: { deck: true } })
    if (!card || !card.isActive || !card.deck.isActive) {
      return NextResponse.json({ success: false, error: "ไม่พบการ์ดนี้" }, { status: 404 })
    }

    const existing = await prisma.flashcardReview.findUnique({ where: { userId_cardId: { userId: user.userId, cardId } } })
    const now = new Date()
    const next = applyReview(existing, grade, now)

    const wasCorrect = answerMode === "SELF_GRADE" ? null : grade >= 3

    const [review] = await prisma.$transaction([
      prisma.flashcardReview.upsert({
        where: { userId_cardId: { userId: user.userId, cardId } },
        update: {
          repetitions: next.repetitions,
          easeFactor: next.easeFactor,
          interval: next.interval,
          lapses: next.lapses,
          status: next.status,
          lastReviewedAt: next.lastReviewedAt,
          nextReviewAt: next.nextReviewAt,
        },
        create: {
          userId: user.userId,
          cardId,
          repetitions: next.repetitions,
          easeFactor: next.easeFactor,
          interval: next.interval,
          lapses: next.lapses,
          status: next.status,
          lastReviewedAt: next.lastReviewedAt,
          nextReviewAt: next.nextReviewAt,
        },
      }),
      prisma.flashcardReviewLog.create({
        data: {
          userId: user.userId,
          cardId,
          grade,
          intervalBefore: existing?.interval ?? 0,
          intervalAfter: next.interval,
          easeFactorAfter: next.easeFactor,
          answerMode,
          userAnswer: userAnswer ?? null,
          wasCorrect,
        },
      }),
    ])

    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    console.error("Save flashcard review error:", error)
    return NextResponse.json({ success: false, error: "Failed to save review" }, { status: 500 })
  }
}
