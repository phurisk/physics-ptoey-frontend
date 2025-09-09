"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { bannerSlides as fallbackSlides } from "@/lib/dummy-data"

type Slide = { id: string | number; image: string }

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])         
  const [loading, setLoading] = useState(true)                

  useEffect(() => {
    let isMounted = true

    async function loadBannerPosts() {
      try {
        const res = await fetch(`/api/posts`, { cache: "no-store" })
        if (res.ok) {
          console.log("[HeroBanner] Fetch /api/posts: OK", res.status)
        } else {
          console.warn("[HeroBanner] Fetch /api/posts: NOT OK", res.status, res.statusText)
        }
        const json: any = await res.json().catch(() => null)

        const items = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : []

        const targetName = "ป้ายประกาศหลัก"
        const typed = items.filter((p: any) => p?.postType?.name === targetName)

        const now = new Date()
        const activePublished = typed.filter((p: any) => {
          const isActive = p?.isActive !== false
          const publishedAt = p?.publishedAt ? new Date(p.publishedAt) : null
          return isActive && (!publishedAt || publishedAt <= now)
        })

        const mapped: Slide[] = activePublished
          .map((p: any, idx: number) => ({
            id: p?.id ?? idx,
            image: p?.imageUrl || p?.imageUrlMobileMode || "",
          }))
          .filter((s: Slide) => !!s.image)

        console.log(`[HeroBanner] Slides mapped from API: ${mapped.length}`)

        if (!isMounted) return

        if (mapped.length > 0) {
          setSlides(mapped) 
          setCurrentSlide(0)
          console.log(`[HeroBanner] ใช้รูปจาก API จำนวน ${mapped.length} ภาพ`)
        } else {

          console.warn(
            `[HeroBanner] API ไม่มีรูป (imageUrl/imageUrlMobileMode) → ใช้รูป dummy (${fallbackSlides.length} ภาพ)`
          )
          setSlides(fallbackSlides)
          setCurrentSlide(0)
        }
      } catch (err) {
        console.error("[HeroBanner] Failed to load banner posts", err)

        if (isMounted) {
          setSlides(fallbackSlides)
          setCurrentSlide(0)
        }
      } finally {
        if (isMounted) setLoading(false) 
      }
    }

    loadBannerPosts()
    return () => {
      isMounted = false
    }
  }, [])


  useEffect(() => {
    if (loading || slides.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length, loading])

  const nextSlide = () => {
    if (!slides.length) return
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    if (!slides.length) return
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="relative w-full aspect-[3840/1799] overflow-hidden px-2 py-1 md:py-2 md:px-8">
      <div className="relative w-full h-full">

        {loading && (
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="h-full w-full banner-shimmer" />
          </div>
        )}

        {!loading &&
          slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={slide.image || "/placeholder.svg"}
                alt="Hero Banner"
                fill
                className="object-cover rounded-xl"
                fetchPriority={index === 0 ? "high" : undefined}
              />
              <div className="absolute inset-0 bg-black/0" />
            </div>
          ))}
      </div>

      {/* ปุ่มเลื่อน */}
      {/*
      <button
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-black hover:bg-black/20 p-2 rounded-full"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:bg-black/20 p-2 rounded-full"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      */}

      {!loading && slides.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentSlide ? "bg-yellow-400" : "bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .banner-shimmer {
          background: linear-gradient(
            90deg,
            rgba(229, 229, 229, 1) 0%,
            rgba(243, 244, 246, 1) 50%,
            rgba(229, 229, 229, 1) 100%
          );
          background-size: 200% 100%;
          animation: bannerShimmer 1.4s ease-in-out infinite;
          border-radius: 0.75rem; /* ให้ขอบมนเท่ากับ rounded-xl */
        }
        @keyframes bannerShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </section>
  )
}
