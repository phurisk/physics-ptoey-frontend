"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Play, Youtube, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { teachingVideos } from "@/lib/dummy-data"

type Video = (typeof teachingVideos)[number]

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

  if (!isOpen || !youtubeId) return null

 
  const src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`

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
          className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white transition"
        >
          <X className="w-5 h-5 text-gray-900" />
        </button>

      
        <div className="aspect-video w-full">
          <iframe
            title={title ?? "YouTube video"}
            src={src}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}

export default function TeachingVideos() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Video | null>(null)

  const openVideo = useCallback((video: Video) => {
    setActive(video)
    setOpen(true)
  }, [])

  const closeVideo = useCallback(() => {
    setOpen(false)
  
    setTimeout(() => setActive(null), 150)
  }, [])

  const handleVideoClick = (youtubeId: string) => {
 
    const v = teachingVideos.find((t) => t.youtubeId === youtubeId)
    if (v) openVideo(v)
  }

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
          {teachingVideos.map((video) => (
            <Card
              key={video.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer pt-0"
              onClick={() => handleVideoClick(video.youtubeId)}
            >
              <CardContent className="p-0">
   
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
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
