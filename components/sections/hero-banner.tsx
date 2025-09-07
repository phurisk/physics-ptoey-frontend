"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

import { bannerSlides as fallbackSlides } from "@/lib/dummy-data"

type Slide = { id: string | number; image: string }

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides)

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

        if (!items.length) {
          console.warn(
            `[HeroBanner] API ไม่มีข้อมูลโพสต์ ใช้รูป dummy แทน (${fallbackSlides.length} ภาพ)`
          )
        } else {
          console.log(`[HeroBanner] Posts loaded: ${items.length}`)
        }

        const targetName = "ป้ายประกาศหลัก"
        const typed = items.filter((p: any) => p?.postType?.name === targetName)
        if (!typed.length) {
          console.warn(
            `[HeroBanner] ไม่พบโพสต์ประเภท "${targetName}" ใช้รูป dummy แทน (${fallbackSlides.length} ภาพ)`
          )
        }

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

        console.log(`[HeroBanner] Slides mapped: ${mapped.length}`)

        if (isMounted && mapped.length) {
          setSlides(mapped)
          setCurrentSlide(0)
          console.log(`[HeroBanner] ใช้รูปจาก API จำนวน ${mapped.length} ภาพ`)
        } else if (isMounted) {
          console.warn(
            `[HeroBanner] API ไม่มีรูป (imageUrl/imageUrlMobileMode) ใช้รูป dummy แทน (${fallbackSlides.length} ภาพ)`
          )
        }
      } catch (err) {
        console.error("[HeroBanner] Failed to load banner posts", err)
      }
    }

    loadBannerPosts()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!slides.length) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

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
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
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

      {/* 
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-black hover:bg-black/20 p-2"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:bg-black/20 p-2"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
      */}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              index === currentSlide ? "bg-yellow-400" : "bg-white/80"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  )
}
