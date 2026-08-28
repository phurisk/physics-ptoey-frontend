import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { resolveEnrollmentAccess } from "@/lib/enrollmentAccess"

// GET: /api/my-courses/course/[id]/exams/[examId] - start a new attempt, or
// resume an in-progress one (idempotent). Blocks if already COMPLETED.
export async function GET(req: Request, { params }: { params: Promise<{ id: string; examId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: courseId, examId } = await params

    const exam = await prisma.exam.findFirst({
      where: { id: examId, courseId, isActive: true },
      include: { course: { select: { id: true, title: true, accessDuration: true } } },
    })
    if (!exam || !exam.course) return NextResponse.json({ success: false, error: "ไม่พบข้อสอบ" }, { status: 404 })

    const enrollment = await prisma.enrollment.findFirst({ where: { userId: user.userId, courseId, status: "ACTIVE" } })
    if (!enrollment) return NextResponse.json({ success: false, error: "คุณยังไม่ได้ลงทะเบียนคอร์สนี้" }, { status: 403 })

    const { isExpire } = resolveEnrollmentAccess(enrollment, exam.course)
    if (isExpire) return NextResponse.json({ success: false, error: "คอร์สหมดอายุแล้ว" }, { status: 403 })

    const existingAttempt = await prisma.examAttempt.findFirst({ where: { examId, userId: user.userId } })
    if (existingAttempt) {
      if (existingAttempt.status === "COMPLETED") {
        return NextResponse.json({ success: false, error: "คุณได้ทำข้อสอบนี้ไปแล้ว" }, { status: 400 })
      }
      const questions = await prisma.question.findMany({
        where: { examId },
        include: { options: { select: { id: true, optionText: true, order: true }, orderBy: { order: "asc" } } },
      })
      return NextResponse.json({
        success: true,
        data: { exam, questions, attemptId: existingAttempt.id, startedAt: existingAttempt.startedAt },
      })
    }

    const questions = await prisma.question.findMany({
      where: { examId },
      include: { options: { select: { id: true, optionText: true, order: true }, orderBy: { order: "asc" } } },
    })
    const totalQuestions = questions.length
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

    // Defensive re-check right before creating, to guard a race between the check above and here.
    const raceCheck = await prisma.examAttempt.findFirst({ where: { examId, userId: user.userId } })
    const attempt =
      raceCheck ?? (await prisma.examAttempt.create({ data: { examId, userId: user.userId, totalQuestions, totalMarks } }))

    return NextResponse.json({ success: true, data: { exam, questions, attemptId: attempt.id, startedAt: attempt.startedAt } })
  } catch (error) {
    console.error("Start/resume exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการเริ่มทำข้อสอบ" }, { status: 500 })
  }
}

type SubmittedAnswer = { questionId: string; optionId?: string; textAnswer?: string }

// POST: /api/my-courses/course/[id]/exams/[examId] - submit answers, auto-grade
export async function POST(req: Request, { params }: { params: Promise<{ examId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { examId } = await params
    const body = await req.json()
    const answers = (body.answers ?? []) as SubmittedAnswer[]

    const attempt = await prisma.examAttempt.findFirst({ where: { examId, userId: user.userId, status: "IN_PROGRESS" } })
    if (!attempt) return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบ" }, { status: 404 })

    const questions = await prisma.question.findMany({ where: { examId }, include: { options: true } })
    const questionById = new Map(questions.map((q) => [q.id, q]))

    let correctAnswers = 0
    let obtainedMarks = 0
    const studentAnswers: {
      attemptId: string
      questionId: string
      optionId: string | null
      textAnswer: string | null
      isCorrect: boolean
      marks: number
    }[] = []

    for (const answer of answers) {
      const question = questionById.get(answer.questionId)
      if (!question) continue

      if (question.questionType === "MULTIPLE_CHOICE" || question.questionType === "TRUE_FALSE") {
        const isCorrect = !!answer.optionId && question.options.some((o) => o.id === answer.optionId && o.isCorrect)
        if (isCorrect) {
          correctAnswers += 1
          obtainedMarks += question.marks
        }
        studentAnswers.push({
          attemptId: attempt.id,
          questionId: question.id,
          optionId: answer.optionId ?? null,
          textAnswer: null,
          isCorrect,
          marks: isCorrect ? question.marks : 0,
        })
      } else {
        // SHORT_ANSWER: auto-award full marks pending manual review (no
        // teacher-override UI implemented yet — matches reference behavior).
        correctAnswers += 1
        obtainedMarks += question.marks
        studentAnswers.push({
          attemptId: attempt.id,
          questionId: question.id,
          optionId: null,
          textAnswer: answer.textAnswer ?? null,
          isCorrect: true,
          marks: question.marks,
        })
      }
    }

    await prisma.studentAnswer.createMany({ data: studentAnswers })

    const percentage = attempt.totalMarks > 0 ? (obtainedMarks / attempt.totalMarks) * 100 : 0
    const passed = percentage >= 60

    const updated = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { status: "COMPLETED", completedAt: new Date(), correctAnswers, obtainedMarks, percentage, passed },
      include: { exam: { select: { title: true, course: { select: { title: true } } } } },
    })

    return NextResponse.json({
      success: true,
      message: "ส่งคำตอบสำเร็จ",
      result: {
        attemptId: updated.id,
        totalQuestions: updated.totalQuestions,
        correctAnswers: updated.correctAnswers,
        totalMarks: updated.totalMarks,
        obtainedMarks: updated.obtainedMarks,
        percentage: updated.percentage,
        passed: updated.passed,
        exam: updated.exam,
        completedAt: updated.completedAt,
      },
    })
  } catch (error) {
    console.error("Submit exam error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการส่งคำตอบ" }, { status: 500 })
  }
}
