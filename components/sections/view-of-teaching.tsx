"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import http from "@/lib/http"

type Slide = {
  id: string | number
  src: string
  alt: string
  title: string
}

const fallbackSlides: Slide[] = [
  { id: 1, src: "/view1.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 2, src: "/view2.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 3, src: "/view3.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 4, src: "/view4.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 5, src: "/view5.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 6, src: "/view6.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 7, src: "/view7.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
  { id: 8, src: "/view8.jpeg", alt: "บรรยากาศการเรียนในห้องเรียน", title: "บรรยากาศการเรียนในห้องเรียน" },
]

export default function ViewOfTeachingSection({
  title = "บรรยากาศการสอน",
  subtitle = "สภาพแวดล้อมการเรียนรู้ที่เอื้อต่อการพัฒนาศักยภาพ",
  autoPlay = true,
  intervalMs = 5000,
  className = "",
}: {
  title?: string
  subtitle?: string
  autoPlay?: boolean
  intervalMs?: number
  className?: string
}) {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides)
  const [current, setCurrent] = useState(0)

  const canNavigate = useMemo(() => slides.length > 1, [slides.length])

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    ;(async () => {
      try {
        const targetName = "บรรยากาศการเรียน"
        const params = new URLSearchParams({ postType: targetName, limit: "12" })
        const res = await http.get(`/api/posts?${params.toString()}`, { signal: controller.signal })
        const json: any = res?.data ?? null
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []

        const now = new Date()
        const typed = list.filter((p: any) => p?.postType?.name === targetName)
        const activePublished = typed.filter((p: any) => {
          const isActive = p?.isActive !== false
          const publishedAt = p?.publishedAt ? new Date(p.publishedAt) : null
          return isActive && (!publishedAt || publishedAt <= now)
        })

        const mapped: Slide[] = activePublished
          .map((p: any, idx: number) => ({
            id: p?.id ?? idx,
            src: p?.imageUrl || p?.imageUrlMobileMode || "",
            alt: p?.title || "บรรยากาศการเรียน",
            title: p?.title || "บรรยากาศการเรียน",
          }))
          .filter((s: Slide) => !!s.src)

        if (mounted && !controller.signal.aborted && mapped.length) {
          setSlides(mapped)
          setCurrent(0)
        }
      } catch {
        // keep fallbackSlides
      }
    })()
    return () => {
      mounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), intervalMs)
    return () => clearInterval(t)
  }, [autoPlay, intervalMs, slides.length])

  const next = () => setCurrent((p) => (p + 1) % slides.length)
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length)

  return (
    <section className={`py-16 px-4 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 bg-[#ffbf00] w-fit mx-auto px-6 py-3 rounded-full shadow-sm">
            {title}
          </h2>
          {subtitle && <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">{subtitle}</p>}
        </div>

        <div className="relative">
          <Card className="overflow-hidden shadow-2xl p-0">
            <CardContent className="p-0">
              <div className="relative h-80 md:h-[500px]">
                <Image
                  src={slides[current]?.src || "/placeholder.svg"}
                  alt={slides[current]?.alt || "บรรยากาศการเรียน"}
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="object-cover"
                  priority
                />

                {canNavigate && (
                  <>
                    <Button
                      onClick={prev}
                      variant="outline"
                      size="icon"
                      aria-label="Previous"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={next}
                      variant="outline"
                      size="icon"
                      aria-label="Next"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <h3 className="text-white text-lg md:text-xl font-semibold">{slides[current]?.title}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          {slides.length > 1 && (
            <div className="flex justify-center mt-5 gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx !== current) setCurrent(idx)
                  }}
                  aria-label={`Go to image ${idx + 1}`}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    idx === current ? "bg-yellow-400 scale-125" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
