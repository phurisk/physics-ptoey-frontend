// One-off: create a PDF-mode mock exam for testing — fetches a small public
// domain placeholder PDF, re-uploads it to our own Vercel Blob storage (never
// hotlink an external URL from examPdfUrl), then creates the exam + a few
// example answer-key questions.
// Run: node scripts/seed-example-pdf-mock-exam.js
const fs = require("fs")
const path = require("path")

// Minimal .env loader (no dotenv dependency in this project) — only fills in
// vars not already set in the shell environment.
const envPath = path.join(__dirname, "..", ".env")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1")
    }
  }
}

// Local .env has no BLOB_READ_WRITE_TOKEN configured — fall back to the
// value in the (git-ignored, local-only) push-vercel-env.sh script.
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  const secretsScript = path.join(__dirname, "push-vercel-env.sh")
  if (fs.existsSync(secretsScript)) {
    const match = fs.readFileSync(secretsScript, "utf8").match(/BLOB_READ_WRITE_TOKEN"\s+"([^"]+)"/)
    if (match) process.env.BLOB_READ_WRITE_TOKEN = match[1]
  }
}

const { PrismaClient } = require("@prisma/client")
const { put } = require("@vercel/blob")

const prisma = new PrismaClient()

const SAMPLE_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

const QUESTIONS = [
  {
    questionText: "[คำถามอ้างอิงจากข้อ 1 ในไฟล์ PDF] คำตอบที่ถูกต้องคือข้อใด",
    questionType: "MULTIPLE_CHOICE",
    marks: 2,
    options: [
      { optionText: "ก", isCorrect: false },
      { optionText: "ข", isCorrect: true },
      { optionText: "ค", isCorrect: false },
      { optionText: "ง", isCorrect: false },
    ],
  },
  {
    questionText: "[คำถามอ้างอิงจากข้อ 2 ในไฟล์ PDF] ข้อความในไฟล์ถูกต้องหรือไม่",
    questionType: "TRUE_FALSE",
    marks: 1,
    options: [
      { optionText: "จริง", isCorrect: true },
      { optionText: "เท็จ", isCorrect: false },
    ],
  },
  {
    questionText: "[คำถามอ้างอิงจากข้อ 3 ในไฟล์ PDF] จงเขียนคำตอบ",
    questionType: "SHORT_ANSWER",
    marks: 3,
    options: [{ optionText: "42", isCorrect: true }],
  },
]

async function main() {
  console.log("Fetching sample PDF...")
  const res = await fetch(SAMPLE_PDF_URL)
  if (!res.ok) throw new Error(`Failed to fetch sample PDF: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()

  console.log("Uploading to Vercel Blob...")
  const filename = `test-${Date.now()}.pdf`
  const blob = await put(`mock-exam-pdfs/${filename}`, Buffer.from(arrayBuffer), {
    access: "public",
    contentType: "application/pdf",
  })
  console.log("Uploaded:", blob.url)

  const exam = await prisma.mockExam.create({
    data: {
      title: "ทดสอบข้อสอบแบบ PDF",
      description: "ข้อสอบตัวอย่างสำหรับทดสอบโหมด PDF + กระดาษคำตอบ (ไฟล์เป็นแค่ placeholder ไม่ใช่โจทย์จริง)",
      subject: "Physics",
      price: 0,
      passingMarks: 0,
      attemptsAllowed: 3,
      allowPracticeMode: true,
      allowRealMode: true,
      practiceUnlockCost: 1,
      isActive: true,
      examPdfUrl: blob.url,
      questions: {
        create: QUESTIONS.map((q, i) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          order: i + 1,
          options: { create: q.options.map((o, idx) => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: idx })) },
        })),
      },
    },
  })

  console.log(`✅ Created PDF-mode mock exam "${exam.title}" (${exam.id}) with ${QUESTIONS.length} questions`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
