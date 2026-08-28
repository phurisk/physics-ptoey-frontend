import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import type { Prisma } from "@prisma/client"

// GET: /api/flashcards/decks - browse active decks with per-user due/new counts
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject") || ""
    const gradeLevel = searchParams.get("gradeLevel") || ""

    const where: Prisma.FlashcardDeckWhereInput = { isActive: true }
    if (subject) where.subject = subject as Prisma.FlashcardDeckWhereInput["subject"]
    if (gradeLevel) where.gradeLevel = gradeLevel as Prisma.FlashcardDeckWhereInput["gradeLevel"]

    const decks = await prisma.flashcardDeck.findMany({
      where,
      include: { topic: { select: { id: true, name: true } }, _count: { select: { cards: { where: { isActive: true } } } } },
      orderBy: { order: "asc" },
    })

    const now = new Date()
    const data = await Promise.all(
      decks.map(async (deck) => {
        const totalCards = deck._count.cards
        const [dueCount, reviewedCount] = await Promise.all([
          prisma.flashcardReview.count({
            where: { userId: user.userId, nextReviewAt: { lte: now }, card: { deckId: deck.id, isActive: true } },
          }),
          prisma.flashcardReview.count({ where: { userId: user.userId, card: { deckId: deck.id, isActive: true } } }),
        ])
        const newCount = Math.max(0, totalCards - reviewedCount)
        return {
          id: deck.id,
          title: deck.title,
          description: deck.description,
          subject: deck.subject,
          gradeLevel: deck.gradeLevel,
          coverImageUrl: deck.coverImageUrl,
          topic: deck.topic,
          totalCards,
          dueCount,
          newCount,
        }
      })
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("List flashcard decks error:", error)
    return NextResponse.json({ success: false, error: "Failed to load decks" }, { status: 500 })
  }
}
