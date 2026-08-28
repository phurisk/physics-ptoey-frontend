import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"
import { recomputeExamTotalMarks } from "../route"

type OptionInput = { optionText: string; isCorrect?: boolean; order?: number }

// PUT: /api/admin/exams/[examId]/questions/[questionId] - update a question
// and fully replace its options (delete-then-recreate in a transaction,
// since Prisma has no clean nested update-or-create-by-position primitive).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: examId, questionId } = await params
    const body = await req.json()

    const existing = await prisma.question.findFirst({ where: { id: questionId, examId } })
    if (!existing) return NextResponse.json({ success: false, error: "ไม่พบคำถาม" }, { status: 404 })

    const options = (body.options || []) as OptionInput[]

    const question = await prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({ where: { questionId } })

      return tx.question.update({
        where: { id: questionId },
        data: {
          questionText: body.questionText,
          questionImage: body.questionImage || null,
          questionType: body.questionType,
          marks: body.marks ? parseInt(body.marks, 10) : 1,
          explanation: body.explanation || null,
          options:
            options.length > 0
              ? {
                  create: options.map((o, idx) => ({
                    optionText: o.optionText,
                    isCorrect: !!o.isCorrect,
                    order: o.order ?? idx,
                  })),
                }
              : undefined,
        },
        include: { options: { orderBy: { order: "asc" } } },
      })
    })

    await recomputeExamTotalMarks(examId)

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขคำถาม" }, { status: 400 })
  }
}

// DELETE: /api/admin/exams/[examId]/questions/[questionId] - delete a
// question (options cascade). Blocked if students have already answered it.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: examId, questionId } = await params

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.findFirst({ where: { id: questionId, examId } })
      if (!question) throw new Error("ไม่พบคำถาม")

      const answerCount = await tx.studentAnswer.count({ where: { questionId } })
      if (answerCount > 0) {
        throw new Error(`ไม่สามารถลบคำถามได้ เนื่องจากมีนักเรียนตอบคำถามนี้ไปแล้ว ${answerCount} คำตอบ`)
      }

      await tx.question.delete({ where: { id: questionId } })
      return { id: question.id }
    })

    await recomputeExamTotalMarks(examId)

    return NextResponse.json({ success: true, message: "ลบคำถามสำเร็จ", data: result })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบคำถาม" },
      { status: 400 }
    )
  }
}
