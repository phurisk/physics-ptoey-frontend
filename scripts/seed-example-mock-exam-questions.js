// One-off: add example questions to the existing "MOCK Alevel Physics" mock
// exam (which currently has 0 questions, blocking any attempt from starting)
// so there's something to test against. Run: node scripts/seed-example-mock-exam-questions.js
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const EXAM_ID = "58befde3-9236-40c0-b474-7e9917107a0d" // MOCK Alevel Physics

const QUESTIONS = [
  {
    questionText: "วัตถุมวล 2 kg เคลื่อนที่ด้วยความเร่งคงที่ 3 m/s^2 แรงลัพธ์ที่กระทำต่อวัตถุมีค่าเท่าใด",
    questionType: "MULTIPLE_CHOICE",
    marks: 2,
    explanation: "จาก F = ma = 2 × 3 = 6 N",
    options: [
      { optionText: "3 N", isCorrect: false },
      { optionText: "5 N", isCorrect: false },
      { optionText: "6 N", isCorrect: true },
      { optionText: "8 N", isCorrect: false },
    ],
  },
  {
    questionText: "แสงเดินทางในสุญญากาศด้วยอัตราเร็วประมาณ 3×10^8 m/s ไม่ว่าจะสังเกตจากกรอบอ้างอิงใดก็ตาม",
    questionType: "TRUE_FALSE",
    marks: 1,
    explanation: "เป็นสมมติฐานพื้นฐานของทฤษฎีสัมพัทธภาพพิเศษของไอน์สไตน์",
    options: [
      { optionText: "จริง", isCorrect: true },
      { optionText: "เท็จ", isCorrect: false },
    ],
  },
  {
    questionText: "ลูกบอลถูกโยนขึ้นในแนวดิ่งด้วยความเร็วต้น 20 m/s (g = 10 m/s^2) ลูกบอลจะขึ้นไปสูงสุดกี่เมตร",
    questionType: "SHORT_ANSWER",
    marks: 3,
    numericTolerance: 0.5,
    explanation: "h = v^2 / (2g) = 20^2 / 20 = 20 m",
    options: [{ optionText: "20", isCorrect: true }],
  },
  {
    questionText: "ข้อใดคือหน่วยของความต่างศักย์ไฟฟ้า (SI unit ของ Voltage)",
    questionType: "MULTIPLE_CHOICE",
    marks: 1,
    explanation: "โวลต์ (V) คือหน่วยของความต่างศักย์ไฟฟ้า",
    options: [
      { optionText: "แอมแปร์ (A)", isCorrect: false },
      { optionText: "โวลต์ (V)", isCorrect: true },
      { optionText: "โอห์ม (Ω)", isCorrect: false },
      { optionText: "วัตต์ (W)", isCorrect: false },
    ],
  },
  {
    questionText: "คลื่นเสียงเป็นคลื่นตามยาว (longitudinal wave)",
    questionType: "TRUE_FALSE",
    marks: 1,
    explanation: "คลื่นเสียงเคลื่อนที่โดยการอัดขยายของตัวกลางในทิศเดียวกับการเคลื่อนที่ของคลื่น จึงเป็นคลื่นตามยาว",
    options: [
      { optionText: "จริง", isCorrect: true },
      { optionText: "เท็จ", isCorrect: false },
    ],
  },
]

async function main() {
  const exam = await prisma.mockExam.findUnique({ where: { id: EXAM_ID } })
  if (!exam) throw new Error(`Mock exam ${EXAM_ID} not found`)

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i]
    await prisma.mockQuestion.create({
      data: {
        mockExamId: EXAM_ID,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        numericTolerance: q.numericTolerance ?? null,
        explanation: q.explanation ?? null,
        order: i + 1,
        options: {
          create: q.options.map((o, idx) => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: idx })),
        },
      },
    })
  }

  console.log(`✅ Added ${QUESTIONS.length} example questions to "${exam.title}" (${EXAM_ID})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
