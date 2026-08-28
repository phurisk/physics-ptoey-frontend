import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// POST: /api/admin/flashcards/bulk - import SELF_GRADE cards from tab-separated
// text (one card per line: front<TAB>back), so admins can paste 2 columns
// copied directly from Excel/Google Sheets. MULTIPLE_CHOICE/TYPED cards can't
// safely fit on one line, so bulk import only supports SELF_GRADE.
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { deckId, text } = body || {}
    if (!deckId || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "deckId and text are required" }, { status: 400 })
    }

    const deck = await prisma.flashcardDeck.findUnique({ where: { id: deckId } })
    if (!deck) return NextResponse.json({ success: false, error: "ไม่พบชุดแฟลชการ์ด" }, { status: 404 })

    const lines = text.split("\n")
    const skippedLines: number[] = []
    const toCreate: { front: string; back: string }[] = []

    lines.forEach((rawLine: string, idx: number) => {
      const line = rawLine.trim()
      if (!line) return
      const [front, ...rest] = line.split("\t")
      const back = rest.join("\t").trim()
      if (!front?.trim() || !back) {
        skippedLines.push(idx + 1)
        return
      }
      toCreate.push({ front: front.trim(), back })
    })

    if (toCreate.length === 0) {
      return NextResponse.json({ success: false, error: "ไม่มีข้อมูลที่นำเข้าได้ กรุณาตรวจสอบรูปแบบ (หน้า<TAB>หลัง ต่อบรรทัด)" }, { status: 400 })
    }

    const maxOrder = await prisma.flashcard.aggregate({ where: { deckId }, _max: { order: true } })
    let order = maxOrder._max.order ?? 0

    await prisma.flashcard.createMany({
      data: toCreate.map((c) => {
        order += 1
        return { deckId, front: c.front, back: c.back, answerMode: "SELF_GRADE", order }
      }),
    })

    return NextResponse.json({
      success: true,
      message: `นำเข้าสำเร็จ ${toCreate.length} ใบ${skippedLines.length ? ` (ข้าม ${skippedLines.length} บรรทัด: ${skippedLines.join(", ")})` : ""}`,
      data: { imported: toCreate.length, skippedLines },
    })
  } catch (error) {
    console.error("Bulk import flashcards error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการนำเข้าการ์ด" }, { status: 400 })
  }
}
