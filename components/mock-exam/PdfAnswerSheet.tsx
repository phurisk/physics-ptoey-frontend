"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { RenderPageProps, Slot } from "@react-pdf-viewer/core"
import { Lock, Coins, Loader2 } from "lucide-react"
import PdfViewer from "@/components/pdf/pdf-viewer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ExamProgressBar from "./ExamProgressBar"
import DrawableCanvasLayer, { type DrawApi } from "./DrawableCanvasLayer"
import DrawToolbar, { DEFAULT_DRAW_SETTINGS } from "./DrawToolbar"
import type { DrawSettings } from "./freehand-engine"
import type { Question } from "@/app/mock-exams/attempt/[attemptId]/page"
import { optionLabelFor, type OptionLabelStyle } from "@/lib/mock-exam-option-label"
import { cn } from "@/lib/utils"

type Answers = Record<string, { optionId?: string; textAnswer?: string; isCorrect?: boolean }>

function renderSlot(slot: Slot, key?: string) {
  return (
    <div key={key} {...slot.attrs}>
      {slot.children}
      {slot.subSlot && renderSlot(slot.subSlot)}
    </div>
  )
}

export default function PdfAnswerSheet({
  examPdfUrl,
  questions,
  answers,
  practiceUnlockCost,
  optionLabelStyle,
  unlocking,
  onTextChange,
  onSaveAnswer,
  onUnlock,
}: {
  examPdfUrl: string
  questions: Question[]
  answers: Answers
  practiceUnlockCost: number
  optionLabelStyle?: OptionLabelStyle
  unlocking: string | null
  onTextChange: (questionId: string, value: string) => void
  onSaveAnswer: (questionId: string, payload: { optionId?: string; textAnswer?: string }) => void
  onUnlock: (questionId: string) => void
}) {
  const answeredCount = questions.filter((q) => answers[q.id]?.optionId || answers[q.id]?.textAnswer).length

  const [settings, setSettings] = useState<DrawSettings>({ ...DEFAULT_DRAW_SETTINGS, penColor: "#dc2626" })
  const canvasApisRef = useRef<Map<number, DrawApi>>(new Map())
  const lastDrawnPageRef = useRef<number | null>(null)
  // Read by registerCanvas, which must stay identity-stable across changes.
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const registerCanvas = useCallback(
    (pageIndex: number, api: DrawApi) => {
      canvasApisRef.current.set(pageIndex, api)
      api.setSettings(settingsRef.current)
    },
    // Intentionally dependency-free — this only fires once per page when it is
    // first registered; the effect below propagates later toolbar changes to
    // every already-registered canvas.
    []
  )

  const handleActivity = useCallback((pageIndex: number) => {
    lastDrawnPageRef.current = pageIndex
  }, [])

  // Push toolbar changes to every registered canvas imperatively, since the PDF
  // viewer caches each page rendered output and never re-invokes renderPage
  // (and therefore DrawableCanvasLayer) after this state changes.
  useEffect(() => {
    canvasApisRef.current.forEach((api) => api.setSettings(settings))
  }, [settings])

  const clearAll = () => {
    canvasApisRef.current.forEach((api) => api.clear())
  }

  // Undo/redo act on the page the student last drew on, not on every page.
  const onLastPage = (fn: (api: DrawApi) => void) => {
    const page = lastDrawnPageRef.current
    if (page === null) return
    const api = canvasApisRef.current.get(page)
    if (api) fn(api)
  }

  const renderPage = (props: RenderPageProps) => (
    <>
      {renderSlot(props.canvasLayer, "canvas")}
      {renderSlot(props.textLayer, "text")}
      {renderSlot(props.annotationLayer, "annotation")}
      <DrawableCanvasLayer
        width={props.width}
        height={props.height}
        pageIndex={props.pageIndex}
        initialSettings={settings}
        onRegister={registerCanvas}
        onActivity={handleActivity}
      />
    </>
  )

  return (
    // Fills whatever height the exam page gives it (no fixed vh), so the PDF
    // and the answer panel scroll inside their own boxes instead of stretching
    // the page.
    <div
      className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,40%)] gap-4 lg:grid-cols-[1fr_300px] lg:grid-rows-[minmax(0,1fr)]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-2">
          <DrawToolbar
            settings={settings}
            onChange={setSettings}
            onUndo={() => onLastPage((api) => api.undo())}
            onRedo={() => onLastPage((api) => api.redo())}
            onClear={clearAll}
          />
          <span className="ml-auto hidden text-xs text-gray-400 xl:inline">
            โหมดมือ = เลื่อนหน้าอย่างเดียว • สิ่งที่เขียนไม่ถูกบันทึก
          </span>
        </div>
        <div className="min-h-0 flex-1 select-none">
          <PdfViewer fileUrl={examPdfUrl} showLayoutSidebar={false} renderPage={renderPage} />
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
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
                <div className="flex flex-wrap gap-2">
                  {q.options?.map((opt, optIdx) => {
                    const selected = answers[q.id]?.optionId === opt.id
                    const label = optionLabelFor(optIdx, optionLabelStyle)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSaveAnswer(q.id, { optionId: opt.id })}
                        title={opt.optionText}
                        className={cn(
                          // A round bubble like a real answer sheet, not a
                          // square button — this is what's tapped to "shade
                          // in" a choice.
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                          opt.optionImage && "h-14 w-14",
                          selected ? "border-[#004B7D] bg-[#004B7D] text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {opt.optionImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={opt.optionImage} alt={label} className="h-full w-full rounded-full object-cover" />
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
