"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Frown, Meh, Smile, PartyPopper, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { http } from "@/lib/http"
import { checkTypedAnswer } from "@/lib/check-typed-answer"
import { formatInterval } from "@/lib/format-interval"

type CardOption = { id: string; optionText: string; isCorrect: boolean }
type StudyCard = {
  id: string
  front: string
  back: string
  hint?: string | null
  answerMode: "SELF_GRADE" | "MULTIPLE_CHOICE" | "TYPED"
  acceptedAnswers: string[]
  numericTolerance?: number | null
  options: CardOption[]
}
type StudyQueue = {
  deck: { id: string; title: string }
  cards: StudyCard[]
  dueCount: number
  newCount: number
  total: number
}

const OPTION_LABELS = ["ก", "ข", "ค", "ง", "จ", "ฉ"]

export default function FlashcardStudyPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [queue, setQueue] = useState<StudyQueue | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [typedAnswer, setTypedAnswer] = useState("")
  const [typedResult, setTypedResult] = useState<{ grade: number; kind: "ok" | "near" | "no" } | null>(null)
  const [grading, setGrading] = useState(false)

  useEffect(() => {
    let active = true
    http
      .get(`/api/flashcards/study/${deckId}`)
      .then((res) => {
        if (active && res.data?.success) setQueue(res.data.data)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [deckId])

  const resetCardState = () => {
    setFlipped(false)
    setSelectedOptionId(null)
    setTypedAnswer("")
    setTypedResult(null)
  }

  const submitGrade = async (card: StudyCard, grade: number, userAnswer?: string) => {
    if (grading) return
    setGrading(true)
    try {
      const res = await http.post("/api/flashcards/review", { cardId: card.id, grade, answerMode: card.answerMode, userAnswer })
      if (res.data?.success) {
        toast({ description: `บันทึกแล้ว — เจอกันอีกครั้งใน ${formatInterval(res.data.data.interval)}` })
      }
      setReviewedCount((c) => c + 1)
      setIndex((i) => i + 1)
      resetCardState()
    } finally {
      setGrading(false)
    }
  }

  const handleMultipleChoice = (card: StudyCard, option: CardOption) => {
    if (selectedOptionId) return
    setSelectedOptionId(option.id)
    const grade = option.isCorrect ? 4 : 0
    setTimeout(() => submitGrade(card, grade, option.id), 700)
  }

  const handleCheckTyped = (card: StudyCard) => {
    const result = checkTypedAnswer(typedAnswer, card.acceptedAnswers, card.numericTolerance ?? null)
    setTypedResult(result)
  }

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">กำลังโหลด...</div>
  if (!queue) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">ไม่พบชุดแฟลชการ์ด</div>

  const card = queue.cards[index]
  const isDone = index >= queue.cards.length

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">{queue.deck.title}</h1>
        {!isDone && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              การ์ดที่ {index + 1} / {queue.cards.length}
            </p>
            <Progress value={(index / queue.cards.length) * 100} className="mt-2 h-2" />
          </>
        )}
      </div>

      {isDone ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <PartyPopper className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">จบรอบแล้ว 🎉</h2>
            <p className="text-muted-foreground">ทบทวนไปทั้งหมด {reviewedCount} ใบ</p>
            <Button onClick={() => router.push("/flashcards")}>กลับไปหน้าแฟลชการ์ด</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {card.answerMode === "SELF_GRADE" && (
              <div>
                <div
                  className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border p-6 text-center"
                  onClick={() => setFlipped((f) => !f)}
                >
                  <p className="text-lg text-foreground">{flipped ? card.back : card.front}</p>
                  {!flipped && card.hint && <p className="mt-2 text-sm text-muted-foreground">คำใบ้: {card.hint}</p>}
                  {!flipped && <p className="mt-4 text-xs text-muted-foreground">แตะเพื่อดูคำตอบ</p>}
                </div>

                {flipped && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button variant="outline" className="flex flex-col gap-1 py-3" onClick={() => submitGrade(card, 0)} disabled={grading}>
                      <Frown className="h-5 w-5 text-red-500" />
                      ลืม
                    </Button>
                    <Button variant="outline" className="flex flex-col gap-1 py-3" onClick={() => submitGrade(card, 3)} disabled={grading}>
                      <Meh className="h-5 w-5 text-amber-500" />
                      ยาก
                    </Button>
                    <Button variant="outline" className="flex flex-col gap-1 py-3" onClick={() => submitGrade(card, 4)} disabled={grading}>
                      <Smile className="h-5 w-5 text-green-500" />
                      จำได้
                    </Button>
                    <Button variant="outline" className="flex flex-col gap-1 py-3" onClick={() => submitGrade(card, 5)} disabled={grading}>
                      <PartyPopper className="h-5 w-5 text-blue-500" />
                      ง่าย
                    </Button>
                  </div>
                )}
              </div>
            )}

            {card.answerMode === "MULTIPLE_CHOICE" && (
              <div>
                <p className="mb-4 text-lg text-foreground">{card.front}</p>
                <div className="space-y-2">
                  {card.options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id
                    const showResult = !!selectedOptionId
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleMultipleChoice(card, opt)}
                        disabled={!!selectedOptionId}
                        className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                          showResult && opt.isCorrect
                            ? "border-green-300 bg-green-50"
                            : showResult && isSelected
                              ? "border-red-300 bg-red-50"
                              : "hover:bg-muted"
                        }`}
                      >
                        <span className="font-semibold text-muted-foreground">{OPTION_LABELS[idx]}.</span>
                        <span className="flex-1">{opt.optionText}</span>
                        {showResult && opt.isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {showResult && isSelected && !opt.isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {card.answerMode === "TYPED" && (
              <div>
                <p className="mb-4 text-lg text-foreground">{card.front}</p>
                {!typedResult ? (
                  <div className="flex gap-2">
                    <Input value={typedAnswer} onChange={(e) => setTypedAnswer(e.target.value)} placeholder="พิมพ์คำตอบ..." />
                    <Button onClick={() => handleCheckTyped(card)} disabled={!typedAnswer.trim()}>
                      ตรวจ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`rounded-md border p-3 text-sm ${
                        typedResult.kind === "ok" ? "border-green-300 bg-green-50" : typedResult.kind === "near" ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50"
                      }`}
                    >
                      {typedResult.kind === "ok" && "ถูกต้อง!"}
                      {typedResult.kind === "near" && "ใกล้เคียง (สะกดคลาดเคลื่อนเล็กน้อย)"}
                      {typedResult.kind === "no" && "ไม่ถูกต้อง"}
                      <div className="mt-1 text-muted-foreground">เฉลย: {card.acceptedAnswers[0]}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => submitGrade(card, 3, typedAnswer)} disabled={grading}>
                        ยากกว่านั้น
                      </Button>
                      <Button size="sm" onClick={() => submitGrade(card, typedResult.grade, typedAnswer)} disabled={grading}>
                        {grading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        ถัดไป →
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => submitGrade(card, 5, typedAnswer)} disabled={grading}>
                        ง่ายมาก
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isDone && (
        <div className="mt-4 flex justify-center gap-2">
          <Badge variant="outline">ถึงกำหนด {queue.dueCount}</Badge>
          <Badge variant="outline">ใหม่ {queue.newCount}</Badge>
        </div>
      )}
    </div>
  )
}
