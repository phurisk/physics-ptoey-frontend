"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, Clock, Sparkles, Video, ImageIcon, Radio } from "lucide-react"

type Post = {
  id: string
  title?: string
  content?: string | null
  imageUrl?: string | null
  imageUrlMobileMode?: string | null
}

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
    return () => {
      cancelled = true
    }
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
        const mapped: Post[] = list.map((p: any) => ({
          id: String(p?.id),
          title: p?.title,
          imageUrl: p?.imageUrl,
          imageUrlMobileMode: p?.imageUrlMobileMode,
        }))
        if (!cancelled) setSummaries(mapped)
      } finally {
        if (!cancelled) setLoadingSummaries(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const lineUrl = "https://line.me/ti/p/@csw9917j"
  const summaryBanner = summaries[0] || null

  return (
    <section className="min-h-screen bg-gradient-to-br from-white via-yellow-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">
            ตารางรอบสด
            <span className="text-yellow-500">, ถ่ายทอดสด</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            รอบเรียนสด (Onsite/Online) และรายละเอียดการสมัคร พร้อมติดตามการเรียนแบบเรียลไทม์
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Video className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">ถ่ายทอดสดคุณภาพ HD</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">เรียนแบบ Interactive</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">ตารางเรียนยืดหยุ่น</span>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-0 border border-gray-100">

            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden relative group">
              {loadingVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                    <p className="text-white/80 text-sm">กำลังโหลดวิดีโอ...</p>
                  </div>
                </div>
              )}

              {videoSrc && (
                <iframe
                  src={videoSrc}
                  className="w-full h-full transition-opacity duration-300"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  title="วิดีโอรอบสด"
                />
              )}

              {!videoSrc && !loadingVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/80 text-lg font-medium">ไม่พบวิดีโอแนะนำรอบสด</p>
                    <p className="text-white/60 text-sm mt-2">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
                  </div>
                </div>
              )}

              <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-600 px-4 py-2 rounded-full text-sm font-medium mb-4 mt-2">
                <Radio className="w-4 h-4" />
                ถ่ายทอดสดจากโรงเรียน
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          {loadingSummaries ? (
            <div className="relative w-full aspect-[283/400] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse border border-gray-200" />
          ) : summaries.length ? (
            <Card className="overflow-hidden border-2 border-gray-100 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl py-0">
              <CardContent className="p-0">
                <div className="relative w-full aspect-[283/400] bg-white">
                  {summaryBanner?.imageUrl && (
                    <Image
                      src={summaryBanner.imageUrl || "/placeholder.svg"}
                      alt={summaryBanner.title || "summary"}
                      fill
                      className="object-contain hidden md:block"
                    />
                  )}
                  {summaryBanner?.imageUrlMobileMode && (
                    <Image
                      src={summaryBanner.imageUrlMobileMode || "/placeholder.svg"}
                      alt={summaryBanner.title || "summary"}
                      fill
                      className="object-contain md:hidden"
                    />
                  )}
                  {!summaryBanner?.imageUrl && !summaryBanner?.imageUrlMobileMode && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">ไม่มีภาพสรุปรอบสด</p>
              <p className="text-gray-400 text-sm mt-2">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-2xl p-8 text-white shadow-xl">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-2">พร้อมเริ่มเรียนแล้วใช่ไหม?</h3>
              <p className="text-yellow-100 mb-6 text-lg">
                ติดต่อสมัครเรียนผ่าน LINE ได้เลย ทีมงานพร้อมให้คำปรึกษาและแนะนำคอร์สที่เหมาะกับคุณ
              </p>

              <a href={lineUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="cursor-pointer bg-[#06C755] hover:bg-[#05b24c] text-white rounded-2xl px-10 py-4 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12.017.572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                ติดต่อสมัครเรียนทาง LINE
              </Button>
              </a>

              <div className="flex flex-wrap justify-center gap-6 mt-6 text-yellow-100 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>ตอบกลับเร็ว</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>คำปรึกษาฟรี</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>บริการตลอดเวลา</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
