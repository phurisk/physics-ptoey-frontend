import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { CARD_INCLUDE } from "@/lib/flashcardValidation"

const NEW_CARDS_PER_DAY = 20

// GET: /api/flashcards/study/[deckId] - today's study queue: due cards first
// (oldest due first), then new cards (never reviewed), capped so a student
// can't flood tomorrow's due queue by opening the whole deck at once.
export async function GET(req: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { deckId } = await params
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { topic: { select: { id: true, name: true } } },
    })
    if (!deck || !deck.isActive) return NextResponse.json({ success: false, error: "ไม่พบชุดแฟลชการ์ด" }, { status: 404 })

    const now = new Date()

    const dueReviews = await prisma.flashcardReview.findMany({
      where: { userId: user.userId, nextReviewAt: { lte: now }, card: { deckId, isActive: true } },
      include: { card: { include: CARD_INCLUDE } },
      orderBy: { nextReviewAt: "asc" },
    })
    const dueCards = dueReviews.map((r) => r.card)
    const reviewedCardIds = await prisma.flashcardReview.findMany({
      where: { userId: user.userId, card: { deckId } },
      select: { cardId: true },
    })
    const reviewedIdSet = new Set(reviewedCardIds.map((r) => r.cardId))

    const newCards = await prisma.flashcard.findMany({
      where: { deckId, isActive: true, id: { notIn: Array.from(reviewedIdSet) } },
      include: CARD_INCLUDE,
      orderBy: { order: "asc" },
      take: NEW_CARDS_PER_DAY,
    })

    const cards = [...dueCards, ...newCards]

    return NextResponse.json({
      success: true,
      data: {
        deck: { id: deck.id, title: deck.title, description: deck.description, subject: deck.subject, gradeLevel: deck.gradeLevel, topic: deck.topic },
        cards,
        dueCount: dueCards.length,
        newCount: newCards.length,
        total: cards.length,
      },
    })
  } catch (error) {
    console.error("Get study queue error:", error)
    return NextResponse.json({ success: false, error: "Failed to load study queue" }, { status: 500 })
  }
}
