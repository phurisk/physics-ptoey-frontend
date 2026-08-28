// Kept out of route files since Next.js route handlers should only export
// HTTP method functions.

export const CARD_INCLUDE = {
  options: { orderBy: { order: "asc" as const } },
}

type OptionInput = { optionText: string; isCorrect?: boolean }

export function validateAnswerModeFields({
  answerMode,
  options,
  acceptedAnswers,
}: {
  answerMode: string
  options?: OptionInput[]
  acceptedAnswers?: string[]
}) {
  if (answerMode === "MULTIPLE_CHOICE") {
    if (!options || options.length < 2) return "กรุณาเพิ่มตัวเลือกอย่างน้อย 2 ตัวเลือก"
    if (!options.some((o) => o.isCorrect)) return "กรุณาเลือกคำตอบที่ถูกต้องอย่างน้อย 1 ตัวเลือก"
  } else if (answerMode === "TYPED") {
    if (!acceptedAnswers || acceptedAnswers.filter((a) => a && a.trim()).length === 0) {
      return "กรุณากรอกคำตอบที่ยอมรับได้อย่างน้อย 1 แบบ"
    }
  }
  return null
}
