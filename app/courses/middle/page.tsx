"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Post = { id: string; title?: string; content?: string | null }
type Course = {
  id: string
  title: string
  coverImageUrl?: string | null
  category?: { name?: string | null }
  price?: number
  isFree?: boolean
}

function getYouTubeEmbed(url: string) {
  const id = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null
}
function getVimeoEmbed(url: string) {
  const id = url.match(/(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(d+)/)?.[1]
  return id ? `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0` : null
}
function extractFirstUrl(text?: string | null) {
  if (!text) return null
  const m = text.match(/https?:[^\s)\]]+/i)
  return m ? m[0] : null
}

export default function MiddleCoursesPage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [summaries, setSummaries] = useState<
    { id: string; desktop?: string | null; mobile?: string | null; title?: string }[]
  >([])
  const [loadingSummaries, setLoadingSummaries] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingVideo(true)
        const params = new URLSearchParams({ postType: "วิดีโอแนะนำ-ม.ต้น", limit: "1" })
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
        const params = new URLSearchParams({ postType: "ภาพสรุป-ม.ต้น" })
        const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const list: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        const mapped = list.map((p: any) => ({
          id: String(p?.id),
          desktop: p?.imageUrl || null,
          mobile: p?.imageUrlMobileMode || null,
          title: p?.title || "",
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingCourses(true)
        const res = await fetch(`/api/courses`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const list: Course[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        const filtered = list.filter((c) => (c as any)?.category?.name === "คอร์สแนะนำ-ม.ต้น")
        if (!cancelled) setCourses(filtered)
      } finally {
        if (!cancelled) setLoadingCourses(false)
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
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">คอร์ส ม.ต้น</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            เลือกคอร์สที่เหมาะกับระดับ ม.ต้น พร้อมวิดีโอแนะนำและเนื้อหาคุณภาพสูง
          </p>
        </div>

        <div className="mb-16">
          <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-yellow-500/20">
            {videoSrc && (
              <iframe
                src={videoSrc}
                className="w-full h-full"
                allowFullScreen
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                title="วิดีโอแนะนำ ม.ต้น"
              />
            )}
            {!videoSrc && !loadingVideo && (
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-80 bg-gray-900/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg">ไม่พบวิดีโอแนะนำ</p>
                </div>
              </div>
            )}
            {loadingVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-16">
          {loadingSummaries ? (
            <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
          ) : summaries.length ? (
            <Card className="overflow-hidden border-2 border-gray-100 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-0">
                <div className="relative w-full aspect-[21/9] bg-white">
                  {summaryBanner?.desktop && (
                    <Image
                      src={summaryBanner.desktop || "/placeholder.svg"}
                      alt={summaryBanner.title || "summary"}
                      fill
                      className="object-contain hidden md:block"
                    />
                  )}
                  {summaryBanner?.mobile && (
                    <Image
                      src={summaryBanner.mobile || "/placeholder.svg"}
                      alt={summaryBanner.title || "summary"}
                      fill
                      className="object-contain md:hidden"
                    />
                  )}
                  {!summaryBanner?.desktop && !summaryBanner?.mobile && (
                    <Image src="/placeholder.svg" alt="summary" fill className="object-contain" />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              ไม่มีภาพสรุป
            </div>
          )}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">คอร์สแนะนำ</h2>
          </div>
          <Link href="/courses">
            <Button
              variant="outline"
              className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-colors duration-300 bg-transparent"
            >
              ดูคอร์สทั้งหมด
            </Button>
          </Link>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={`sk-${i}`} className="overflow-hidden border-2 border-gray-100">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-100 animate-pulse" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-lg w-32 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.slice(0, 3).map((c) => (
              <Card
                key={c.id}
                className="overflow-hidden group border-2 border-gray-100 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl"
              >
                <CardContent className="p-0">
                  <div className="aspect-video relative bg-white overflow-hidden">
                    <Image
                      src={c.coverImageUrl || "/placeholder.svg"}
                      alt={c.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6 space-y-4 bg-white">
                    <div className="font-bold text-gray-900 line-clamp-2 text-lg leading-tight">{c.title}</div>
                    <div className="flex items-center gap-2">
                      {c.isFree ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          ฟรี
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">
                          ฿{Number(c.price || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Link href={`/courses/${encodeURIComponent(c.id)}`}>
                      <Button className="bg-yellow-500 hover:bg-yellow-600 text-white w-full font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <p className="text-lg">ยังไม่มีคอร์สแนะนำ</p>
          </div>
        )}

        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-gray-600 font-medium">ติดต่อสมัครเรียน?</p>
            <a href={lineUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-[#06C755] hover:bg-[#05b24c] text-white rounded-2xl px-10 py-4 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12.017.572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                แอดไลน์ คลิกเพื่อติดต่อ
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
