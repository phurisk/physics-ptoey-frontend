"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { bannerSlides as fallbackSlides } from "@/lib/dummy-data"
import http from "@/lib/http"

type Slide = {
  id: string | number
  desktop: string  
  mobile: string   
}

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

 
  const [isMobile, setIsMobile] = useState(false)

 
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia("(max-width: 767px)")
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    setIsMobile(mql.matches)

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }
    ;(mql as any).addListener?.(onChange)
    return () => { ;(mql as any).removeListener?.(onChange) }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function loadBannerPosts() {
      try {
        const targetName = "ป้ายประกาศหลัก"
        const params = new URLSearchParams({ postType: targetName, limit: "10" })
        const res = await http.get(`/api/posts?${params.toString()}`)
        const json: any = res.data || null

        const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
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
            desktop: p?.imageUrl || p?.imageUrlMobileMode || "",
            mobile: p?.imageUrlMobileMode || p?.imageUrl || "",
          }))
          .filter((s: Slide) => !!(s.desktop || s.mobile))

        if (!isMounted) return
        if (mapped.length > 0) {
          setSlides(mapped)
          setCurrentSlide(0)
        } else {
          const fb: Slide[] = (fallbackSlides || []).map((s: any, idx: number) => ({
            id: s?.id ?? idx,
            desktop: s?.image || "",
            mobile: s?.image || "",
          }))
          setSlides(fb)
          setCurrentSlide(0)
        }
      } catch {
        if (isMounted) {
          const fb: Slide[] = (fallbackSlides || []).map((s: any, idx: number) => ({
            id: s?.id ?? idx,
            desktop: s?.image || "",
            mobile: s?.image || "",
          }))
          setSlides(fb)
          setCurrentSlide(0)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadBannerPosts()
    return () => { isMounted = false }
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


  const pickSrc = (s: Slide) => (isMobile ? s.mobile || s.desktop : s.desktop || s.mobile)

  return (
   
<section className="w-full px-2 py-1 md:py-2 md:px-8">
  <div className="relative w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden rounded-xl">

    {loading && (
      <div className="absolute inset-0">
        <div className="h-full w-full banner-shimmer" />
      </div>
    )}

    {!loading &&
      slides.map((slide, index) => {
        const src = pickSrc(slide)
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src || "/placeholder.svg"}
              alt="Hero Banner"
              fill
              className="object-contain"
              sizes="100vw"
              fetchPriority={index === currentSlide ? "high" : undefined}
              priority={index === currentSlide}
            />
            <div className="absolute inset-0 bg-black/0" />
          </div>
        )
      })}

    {!loading && slides.length > 0 && (
      <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex space-x-2">
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
      }
      @keyframes bannerShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
</section>

  )
}
