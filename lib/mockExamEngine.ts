import { prisma } from "@/lib/prisma"
import type { MockExam, MockQuestion, MockQuestionOption, QuestionType } from "@prisma/client"

type GradableQuestion = Pick<MockQuestion, "questionType" | "marks" | "numericTolerance">
type GradeInput = { optionId?: string | null; textAnswer?: string | null }

// Pure scoring logic shared by the answer-autosave route (REAL mode grades
// silently, PRACTICE mode reveals immediately) and the submit route (which
// only sums already-graded answers, never re-grades).
export function gradeAnswer(question: GradableQuestion, options: MockQuestionOption[], input: GradeInput) {
  switch (question.questionType as QuestionType) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      const correct = options.find((o) => o.isCorrect)
      const isCorrect = !!input.optionId && input.optionId === correct?.id
      return { isCorrect, marks: isCorrect ? question.marks : 0 }
    }
    case "SHORT_ANSWER": {
      const correct = options.find((o) => o.isCorrect)
      const given = (input.textAnswer ?? "").trim()
      if (!correct || !given) return { isCorrect: false, marks: 0 }

      let isCorrect: boolean
      if (question.numericTolerance != null) {
        const givenNum = Number(given)
        const correctNum = Number(correct.optionText)
        isCorrect =
          Number.isFinite(givenNum) &&
          Number.isFinite(correctNum) &&
          Math.abs(givenNum - correctNum) <= question.numericTolerance
      } else {
        isCorrect = given.toLowerCase() === correct.optionText.trim().toLowerCase()
      }
      return { isCorrect, marks: isCorrect ? question.marks : 0 }
    }
    default:
      return { isCorrect: null as boolean | null, marks: 0 }
  }
}

export async function isQuestionUnlocked(userId: string, questionId: string) {
  const unlock = await prisma.mockPracticeUnlock.findUnique({
    where: { userId_questionId: { userId, questionId } },
  })
  return !!unlock
}

export async function getOrCreateWallet(userId: string) {
  return prisma.mockPracticeWallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

// price === 0 exams are always accessible in REAL mode (no purchase gate).
// A course-tied exam is also unlocked by plain course enrollment — no
// separate purchase needed on top of the course itself.
export async function hasMockExamAccess(userId: string, mockExam: Pick<MockExam, "id" | "price" | "courseId">) {
  if (!mockExam.price) return true

  const purchase = await prisma.mockExamPurchase.findUnique({
    where: { userId_mockExamId: { userId, mockExamId: mockExam.id } },
  })
  if (purchase) return true

  if (mockExam.courseId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: mockExam.courseId } },
    })
    if (enrollment) return true
  }

  return false
}
