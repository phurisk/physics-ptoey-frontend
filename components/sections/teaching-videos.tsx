"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Play, Youtube, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { teachingVideos } from "@/lib/dummy-data"
import http from "@/lib/http"
import { extractYouTubeId, validateYouTubeId } from "@/lib/youtube-utils"

type VideoItem = {
  id: string | number
  title: string
  youtubeId: string
  description: string
}

const fallbackVideos: VideoItem[] = teachingVideos.map((video, idx) => ({
  id: video.id ?? idx,
  title: video.title ?? "",
  youtubeId: video.youtubeId ?? "",
  description: video.description ?? "",
}))

function extractYoutubeIdFromContent(input?: unknown): string | null {
  if (!input) return null
  const raw = String(input).trim()
  if (!raw) return null

  // Handle iframe src extraction
  const iframeSrcMatch = raw.match(/src=["']([^"']+)["']/i)
  const candidate = iframeSrcMatch?.[1] ?? raw
  const decoded = candidate.replace(/&amp;/g, "&").trim()

  return extractYouTubeId(decoded)
}

// Simple YouTube Player Component
function SimpleYouTubePlayer({ videoId, title }: { videoId: string; title?: string }) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // URLs specifically designed for localhost and development
  const urls = [
    // Method 1: No parameters at all (most compatible)
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    
    // Method 2: Regular YouTube (sometimes works better on localhost)
    `https://www.youtube.com/embed/${videoId}`,
    
    // Method 3: With minimal params
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
    
    // Method 4: Different approach - disable some features
    `https://www.youtube.com/embed/${videoId}?rel=0&controls=1&showinfo=0`,
    
    // Method 5: Force HTML5 player
    `https://www.youtube-nocookie.com/embed/${videoId}?html5=1&rel=0`,
    
    // Method 6: Last resort - basic YouTube
    `https://www.youtube.com/embed/${videoId}?controls=1`
  ]

  const handleError = () => {
    console.error(`YouTube URL failed: ${urls[currentUrlIndex]}`)
    
    if (currentUrlIndex < urls.length - 1) {
      console.log(`Trying next URL (${currentUrlIndex + 2}/${urls.length}): ${urls[currentUrlIndex + 1]}`)
      setCurrentUrlIndex(prev => prev + 1)
      setIsLoading(true)
    } else {
      console.error('All YouTube URLs failed')
      setHasError(true)
      setIsLoading(false)
    }
  }

  const handleLoad = () => {
    console.log(`YouTube loaded successfully: ${urls[currentUrlIndex]}`)
    setIsLoading(false)
    setHasError(false)
  }

  const retry = () => {
    setCurrentUrlIndex(0)
    setHasError(false)
    setIsLoading(true)
  }

  if (hasError) {
    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-lg font-semibold">ไม่สามารถโหลดวิดีโอได้</div>
          <p className="text-gray-300 text-sm">
            Error 153: YouTube ไม่อนุญาตให้ embed ใน localhost หรือ development environment
          </p>
          <p className="text-gray-400 text-xs">
            ปัญหานี้จะหายไปเมื่อ deploy ไปยัง production server
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={retry} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              ลองใหม่
            </Button>
            <Button
              onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Youtube className="w-4 h-4 mr-2" />
              ดูบน YouTube
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-800 rounded">
              <p>Debug: ลอง {currentUrlIndex + 1}/{urls.length} URLs แล้ว</p>
              <p>URL สุดท้าย: {urls[currentUrlIndex]}</p>
              <p>วิดีโอ ID: {videoId}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">กำลังโหลดวิดีโอ... ({currentUrlIndex + 1}/{urls.length})</p>
          </div>
        </div>
      )}
      <iframe
        key={`youtube-${videoId}-${currentUrlIndex}`}
        title={title ?? "YouTube video"}
        src={urls[currentUrlIndex]}
        className="w-full h-full"
        allowFullScreen
        allow="autoplay; fullscreen"
        onError={handleError}
        onLoad={handleLoad}
        style={{ border: 'none' }}
      />
    </div>
  )
}

function VideoModal({
  isOpen,
  youtubeId,
  title,
  onClose,
}: {
  isOpen: boolean
  youtubeId: string | null
  title?: string
  onClose: () => void
}) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen || !youtubeId || !validateYouTubeId(youtubeId)) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white transition z-10"
        >
          <X className="w-5 h-5 text-gray-900" />
        </button>

        <div className="aspect-video w-full">
          <SimpleYouTubePlayer videoId={youtubeId} title={title} />
        </div>
      </div>
    </div>
  )
}

export default function TeachingVideos() {
  const [videos, setVideos] = useState<VideoItem[]>(fallbackVideos)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<VideoItem | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const params = new URLSearchParams({ postType: "วิดีโอแนะนำ-หน้าแรก", limit: "12" })
        const res = await http.get(`/api/posts?${params.toString()}`)
        const json: any = res.data ?? null
        const list: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : []

        const mapped = list
          .filter((item) => item?.postType?.name === "วิดีโอแนะนำ-หน้าแรก")
          .map((item: any, idx: number) => {
            const youtubeId = extractYoutubeIdFromContent(item?.content)
            if (!youtubeId) return null

            const title =
              typeof item?.title === "string"
                ? item.title
                : item?.title != null
                ? String(item.title)
                : ""
            const descriptionRaw =
              typeof item?.excerpt === "string"
                ? item.excerpt
                : item?.excerpt != null
                ? String(item.excerpt)
                : ""
            const description = descriptionRaw
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()

            return {
              id: item?.id ?? idx,
              title,
              youtubeId,
              description,
            }
          })
          .filter((video): video is VideoItem => !!video?.youtubeId)

        if (!mounted) return

        if (res.status >= 200 && res.status < 300 && mapped.length) {
          setVideos(mapped)
        } else {
          console.warn("[TeachingVideos] API ไม่คืนข้อมูลที่ต้องการ → ใช้ fallback")
          setVideos(fallbackVideos)
        }
      } catch (error) {
        console.error("[TeachingVideos] Failed to load videos", error)
        if (mounted) setVideos(fallbackVideos)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const openVideo = useCallback((video: VideoItem) => {
    setActive(video)
    setOpen(true)
  }, [])

  const closeVideo = useCallback(() => {
    setOpen(false)
    setTimeout(() => setActive(null), 150)
  }, [])

  return (
    <section className="pt-0 pb-10 lg:pt-24 lg:pb-5 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-5">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 text-balance bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm">ตัวอย่างการสอน</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            ดูตัวอย่างวิธีการสอนของอาจารย์เต้ย ที่ทำให้ฟิสิกส์เป็นเรื่องง่ายและเข้าใจได้
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer pt-0"
              onClick={() => openVideo(video)}
            >
              <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg?height=200&width=350';
                    }}
                  />

                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium flex items-center">
                    <Youtube className="w-4 h-4 mr-1" />
                    YouTube
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 text-balance group-hover:text-yellow-600 transition-colors duration-200">
                    {video.title}
                  </h3>
                  <p className="text-gray-600 text-pretty leading-relaxed">{video.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center ">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">ต้องการดูวิดีโอเพิ่มเติม?</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto ">ติดตาม YouTube Channel ของพี่เต้ยเพื่อดูวิดีโอการสอนฟิสิกส์เพิ่มเติม</p>
          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white transform transition-transform duration-200 hover:scale-110 cursor-pointer"
            onClick={() => window.open("https://youtube.com/@physicsptoey", "_blank")}
          >
            <Youtube className="w-5 h-5 size-5 mr-2 " />
            ติดตาม YouTube
          </Button>
        </div>
      </div>

      <VideoModal
        isOpen={open}
        youtubeId={active?.youtubeId ?? null}
        title={active?.title}
        onClose={closeVideo}
      />
    </section>
  )
}