"use client"

import { Lock, Coins, Loader2 } from "lucide-react"
import PdfViewer from "@/components/pdf/pdf-viewer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ExamProgressBar from "./ExamProgressBar"
import type { Question } from "@/app/mock-exams/attempt/[attemptId]/page"

type Answers = Record<string, { optionId?: string; textAnswer?: string; isCorrect?: boolean }>

export default function PdfAnswerSheet({
  examPdfUrl,
  questions,
  answers,
  practiceUnlockCost,
  unlocking,
  onTextChange,
  onSaveAnswer,
  onUnlock,
}: {
  examPdfUrl: string
  questions: Question[]
  answers: Answers
  practiceUnlockCost: number
  unlocking: string | null
  onTextChange: (questionId: string, value: string) => void
  onSaveAnswer: (questionId: string, payload: { optionId?: string; textAnswer?: string }) => void
  onUnlock: (questionId: string) => void
}) {
  const answeredCount = questions.filter((q) => answers[q.id]?.optionId || answers[q.id]?.textAnswer).length

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]" onContextMenu={(e) => e.preventDefault()}>
      <div className="overflow-hidden rounded-lg border">
        <div className="h-[75vh]">
          <PdfViewer fileUrl={examPdfUrl} showLayoutSidebar={false} />
        </div>
      </div>

      <div className="flex max-h-[75vh] flex-col gap-3 rounded-lg border p-3">
        <h3 className="text-sm font-semibold text-gray-900">รายการคำถาม</h3>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-md border border-gray-200 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">ข้อ {idx + 1}</span>
                <span className="text-gray-400">{q.marks} คะแนน</span>
              </div>

              {q.locked ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    ใช้ {practiceUnlockCost} โทเคน
                  </span>
                  <Button size="sm" variant="outline" disabled={unlocking === q.id} onClick={() => onUnlock(q.id)}>
                    {unlocking === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ) : q.questionType === "SHORT_ANSWER" ? (
                <Input
                  value={answers[q.id]?.textAnswer ?? ""}
                  onChange={(e) => onTextChange(q.id, e.target.value)}
                  onBlur={(e) => onSaveAnswer(q.id, { textAnswer: e.target.value })}
                  placeholder="พิมพ์คำตอบ..."
                  className="h-8 text-sm"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {q.options?.map((opt, optIdx) => {
                    const selected = answers[q.id]?.optionId === opt.id
                    const label = String.fromCharCode(65 + optIdx)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSaveAnswer(q.id, { optionId: opt.id })}
                        title={opt.optionText}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition ${
                          selected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.optionImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={opt.optionImage} alt={label} className="h-6 w-8 rounded object-cover" />
                        ) : (
                          label
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <ExamProgressBar answered={answeredCount} total={questions.length} />
      </div>
    </div>
  )
}
