"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Layers } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectOptions, getSubjectLabel } from "@/lib/constants"
import { http } from "@/lib/http"

type Deck = {
  id: string
  title: string
  description?: string | null
  subject: string
  coverImageUrl?: string | null
  topic?: { id: string; name: string } | null
  totalCards: number
  dueCount: number
  newCount: number
}

export default function FlashcardsListPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState("all")

  useEffect(() => {
    let active = true
    setLoading(true)
    http
      .get("/api/flashcards/decks", { params: { subject: subject !== "all" ? subject : undefined } })
      .then((res) => {
        if (active && res.data?.success) setDecks(res.data.data)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [subject])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Layers className="h-6 w-6 text-primary" />
            แฟลชการ์ด
          </h1>
          <p className="mt-1 text-muted-foreground">ทบทวนเนื้อหาแบบ spaced repetition — ระบบจะเตือนให้ทบทวนตอนใกล้ลืมพอดี</p>
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกวิชา</SelectItem>
            {getSubjectOptions().map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">ยังไม่มีชุดแฟลชการ์ดในขณะนี้</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/flashcards/${deck.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{getSubjectLabel(deck.subject)}</Badge>
                    {deck.topic && <Badge variant="outline">{deck.topic.name}</Badge>}
                  </div>
                  <h3 className="mb-1 line-clamp-2 font-semibold text-foreground">{deck.title}</h3>
                  {deck.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{deck.description}</p>}
                  <div className="mb-3 text-sm text-muted-foreground">{deck.totalCards} ใบทั้งหมด</div>
                  <div className="flex flex-wrap gap-2">
                    {deck.dueCount > 0 ? (
                      <Badge className="bg-red-500">ถึงกำหนดทบทวน {deck.dueCount} ใบ</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        ไม่มีการ์ดค้างทบทวน
                      </Badge>
                    )}
                    {deck.newCount > 0 && <Badge className="bg-blue-500">ใหม่ {deck.newCount} ใบ</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
