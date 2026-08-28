import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { CARD_INCLUDE, validateAnswerModeFields } from "@/lib/flashcardValidation"
import type { Prisma } from "@prisma/client"

// GET: /api/admin/flashcards?deckId=xxx - list cards for a deck
export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const deckId = searchParams.get("deckId")
    if (!deckId) return NextResponse.json({ success: false, error: "deckId is required" }, { status: 400 })

    const page = parseInt(searchParams.get("page") || "", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") || "", 10) || 10
    const search = searchParams.get("search") || ""
    const answerMode = searchParams.get("answerMode") || ""
    const sortBy = searchParams.get("sortBy") || "order"
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc"

    const where: Prisma.FlashcardWhereInput = { deckId }
    if (search) {
      where.OR = [{ front: { contains: search, mode: "insensitive" } }, { back: { contains: search, mode: "insensitive" } }]
    }
    if (answerMode) where.answerMode = answerMode as Prisma.FlashcardWhereInput["answerMode"]

    const [totalCount, cards] = await Promise.all([
      prisma.flashcard.count({ where }),
      prisma.flashcard.findMany({ where, include: CARD_INCLUDE, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * pageSize, take: pageSize }),
    ])

    return NextResponse.json({
      success: true,
      data: cards,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    })
  } catch (error) {
    console.error("Get flashcards error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลการ์ด" }, { status: 500 })
  }
}

// POST: /api/admin/flashcards - create a card
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.deckId || !body.front || !body.back) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const deck = await prisma.flashcardDeck.findUnique({ where: { id: body.deckId } })
    if (!deck) return NextResponse.json({ success: false, error: "ไม่พบชุดแฟลชการ์ด" }, { status: 404 })

    const mode = body.answerMode || "SELF_GRADE"
    const validationError = validateAnswerModeFields({ answerMode: mode, options: body.options, acceptedAnswers: body.acceptedAnswers })
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 })

    const maxOrder = await prisma.flashcard.aggregate({ where: { deckId: body.deckId }, _max: { order: true } })

    const card = await prisma.flashcard.create({
      data: {
        deckId: body.deckId,
        front: body.front,
        frontImage: body.frontImage || null,
        back: body.back,
        backImage: body.backImage || null,
        hint: body.hint || null,
        answerMode: mode,
        acceptedAnswers: mode === "TYPED" ? (body.acceptedAnswers || []).filter((a: string) => a && a.trim()) : [],
        numericTolerance: mode === "TYPED" && body.numericTolerance !== "" && body.numericTolerance != null ? parseFloat(body.numericTolerance) : null,
        order: (maxOrder._max.order ?? 0) + 1,
        options:
          mode === "MULTIPLE_CHOICE" && body.options?.length
            ? { create: body.options.map((o: { optionText: string; isCorrect?: boolean }, idx: number) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect, order: idx })) }
            : undefined,
      },
      include: { options: { orderBy: { order: "asc" } } },
    })

    return NextResponse.json({ success: true, data: card })
  } catch (error) {
    console.error("Create flashcard error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างการ์ด" }, { status: 400 })
  }
}
