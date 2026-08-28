import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/mock-topics/progress - cross-exam weak-topic trend for the
// logged-in student. Topics are shared across all MockExams (subject-scoped,
// not exam-scoped), so this tracks whether a weak point actually improves
// over time instead of just showing a single snapshot.
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const attempts = await prisma.mockExamAttempt.findMany({
      where: { userId: user.userId, mode: "REAL", status: "COMPLETED" },
      select: {
        id: true,
        completedAt: true,
        mockExam: { select: { id: true, title: true } },
        answers: {
          where: { isCorrect: { not: null } },
          select: { isCorrect: true, question: { select: { topicId: true, topic: { select: { name: true } } } } },
        },
      },
      orderBy: { completedAt: "asc" },
    })

    type TopicPoint = { attemptId: string; examTitle: string; date: Date | null; correct: number; total: number; percent: number }
    const topics = new Map<string, { topicName: string; points: TopicPoint[] }>()

    for (const attempt of attempts) {
      const byTopic = new Map<string, { name: string; correct: number; total: number }>()
      for (const a of attempt.answers) {
        if (!a.question.topicId || !a.question.topic) continue
        const entry = byTopic.get(a.question.topicId) || { name: a.question.topic.name, correct: 0, total: 0 }
        entry.total += 1
        if (a.isCorrect) entry.correct += 1
        byTopic.set(a.question.topicId, entry)
      }

      for (const [topicId, { name, correct, total }] of byTopic) {
        const topicEntry = topics.get(topicId) || { topicName: name, points: [] }
        topicEntry.points.push({
          attemptId: attempt.id,
          examTitle: attempt.mockExam.title,
          date: attempt.completedAt,
          correct,
          total,
          percent: Math.round((correct / total) * 100),
        })
        topics.set(topicId, topicEntry)
      }
    }

    const result = Array.from(topics.entries())
      .map(([topicId, { topicName, points }]) => {
        const first = points[0].percent
        const last = points[points.length - 1].percent
        return { topicId, topicName, points, firstPercent: first, latestPercent: last, delta: last - first }
      })
      // Weakest-first — the ones worth a student's attention.
      .sort((a, b) => a.latestPercent - b.latestPercent)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error fetching mock topic progress:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการโหลดพัฒนาการ" }, { status: 500 })
  }
}
