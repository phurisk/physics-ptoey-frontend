"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Post = { id: string; title?: string; content?: string | null; imageUrl?: string | null; imageUrlMobileMode?: string | null }

function getYouTubeEmbed(url: string) {
  const id = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null
}
function getVimeoEmbed(url: string) {
  const id = url.match(/(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(\d+)/)?.[1]
  return id ? `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0` : null
}
function extractFirstUrl(text?: string | null) {
  if (!text) return null
  const m = text.match(/https?:[^\s)\]]+/i)
  return m ? m[0] : null
}

export default function LiveSchedulePage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(true)
  const [summaries, setSummaries] = useState<Post[]>([])
  const [loadingSummaries, setLoadingSummaries] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingVideo(true)
        const params = new URLSearchParams({ postType: "วิดีโอรอบสด", limit: "1" })
        const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const list: Post[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        const first = list[0]
        const url = extractFirstUrl(first?.content || "")
        const embed = url ? getYouTubeEmbed(url) || getVimeoEmbed(url) : null
        if (!cancelled) setVideoSrc(embed)
      } finally {
        if (!cancelled) setLoadingVideo(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingSummaries(true)
        const params = new URLSearchParams({ postType: "ภาพสรุป-รอบสด" })
        const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const list: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        const mapped: Post[] = list.map((p: any) => ({ id: String(p?.id), title: p?.title, imageUrl: p?.imageUrl, imageUrlMobileMode: p?.imageUrlMobileMode }))
        if (!cancelled) setSummaries(mapped)
      } finally {
        if (!cancelled) setLoadingSummaries(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const lineUrl = "https://line.me/ti/p/@csw9917j"

  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">ตารางรอบสดที่โรงเรียน,ถ่ายทอดสด</h1>
          <p className="text-gray-600">รอบเรียนสด (Onsite/Online) และรายละเอียดการสมัคร</p>
        </div>

        <div className="mb-10">
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
            {videoSrc && (
              <iframe
                src={videoSrc}
                className="w-full h-full"
                allowFullScreen
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                title="วิดีโอรอบสด"
              />
            )}
            {!videoSrc && !loadingVideo && (
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-80">
                ไม่พบวิดีโอแนะนำรอบสด
              </div>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ภาพสรุปรอบสด</h2>
          {loadingSummaries ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`sum-sk-${i}`} className="aspect-[16/9] bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : summaries.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaries.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[16/9] bg-white">
                      {s.imageUrl && (
                        <Image src={s.imageUrl} alt={s.title || "summary"} fill className="object-contain hidden md:block" />
                      )}
                      {s.imageUrlMobileMode && (
                        <Image src={s.imageUrlMobileMode} alt={s.title || "summary"} fill className="object-contain md:hidden" />
                      )}
                      {!s.imageUrl && !s.imageUrlMobileMode && (
                        <Image src="/placeholder.svg" alt="summary" fill className="object-contain" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">ไม่มีภาพสรุปรอบสด</div>
          )}
        </div>

        <div className="text-center mt-12">
          <a href={lineUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-[#06C755] hover:bg-[#05b24c] text-white rounded-full px-8">ติดต่อสมัครเรียนทาง LINE</Button>
          </a>
        </div>
      </div>
    </section>
  )
}

