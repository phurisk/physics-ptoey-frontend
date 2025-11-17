"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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
          setSlides([])
        }
      } catch {
        if (isMounted) setSlides([])
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

  const pickSrc = (s: Slide) => (isMobile ? s.mobile || s.desktop : s.desktop || s.mobile)
  const activeSlide = slides[currentSlide] || null
  const activeSrc = activeSlide ? pickSrc(activeSlide) : ""

  return (
    <section className="w-full px-2 py-1 md:py-2 md:px-8">
      <div className="relative w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden rounded-xl">

        {loading && (
          <div className="absolute inset-0">
            <div className="h-full w-full banner-shimmer" />
          </div>
        )}

        {!loading && activeSlide && (
          <div key={`${activeSlide.id}-${currentSlide}`} className="absolute inset-0">
            <Image
              src={activeSrc || "/placeholder.svg"}
              alt="Hero Banner"
              fill
              className="object-contain banner-image"
              sizes="(max-width: 767px) 100vw, (max-width: 1280px) 90vw, 1280px"
              quality={70}
              fetchPriority={currentSlide === 0 ? "high" : undefined}
              priority={currentSlide === 0}
            />
            <div className="absolute inset-0 bg-black/0" />
          </div>
        )}

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
          .banner-image {
            animation: bannerFade 0.7s ease;
          }
          @keyframes bannerShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes bannerFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </section>
  )
}
