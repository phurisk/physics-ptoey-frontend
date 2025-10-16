"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import type React from "react" 
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { studentSuccesses as fallbackSuccesses } from "@/lib/dummy-data"
import http from "@/lib/http"

function ImageModal({
  isOpen,
  onClose,
  image,
}: {
  isOpen: boolean
  onClose: () => void
  image: { src: string; alt: string } | null
}) {
  if (!isOpen || !image) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[500px] w-full max-h-[85vh] bg-background rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="relative w-full h-full">
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            width={1600}
            height={1066}
            className="w-[500px] h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}

export default function StudentSuccess() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(3)
  const [slides, setSlides] = useState<{ id: string | number; image: string }[]>([]) // ← เริ่มว่าง
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  const openModal = (img: { src: string; alt: string }) => {
    setSelectedImage(img)
    setIsModalOpen(true)
    if (typeof document !== "undefined") document.body.style.overflow = "hidden"
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
    if (typeof document !== "undefined") document.body.style.overflow = "auto"
  }

 
  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth
      if (w < 768) setVisible(1)
      else if (w < 1024) setVisible(2)
      else setVisible(3)
    }
    updateVisible()
    window.addEventListener("resize", updateVisible)
    return () => window.removeEventListener("resize", updateVisible)
  }, [])


  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const params = new URLSearchParams({ postType: "ความสำเร็จลูกศิษย์", limit: "24" })
        const res = await http.get(`/api/posts?${params.toString()}`)
        const json: any = res.data || null
        const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []

        const mapped: { id: string | number; image: string }[] =
          items
            ?.map((p: any, idx: number) => ({
              id: p?.id ?? idx,
              image: p?.imageUrl || p?.imageUrlMobileMode || "",
            }))
            .filter((s: { id: string | number; image: string }) => !!s.image) || []

        if (!mounted) return

        if ((res.status >= 200 && res.status < 300) && mapped.length > 0) {
          setSlides(mapped)
          setCurrentSlideSafe(0)
        } else {
          setSlides(fallbackSuccesses)
          setCurrentSlideSafe(0)
        }
      } catch {
        if (mounted) {
          setSlides(fallbackSuccesses)
          setCurrentSlideSafe(0)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const length = slides.length
  const maxIndex = Math.max(0, length - visible)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const hasCapturedPointerRef = useRef(false)

  // กัน index เกินเมื่อจำนวนคอลัมน์เปลี่ยน
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex))
  }, [visible, maxIndex])

  const setCurrentSlideSafe = (idx: number) => {
    setCurrentIndex(Math.min(Math.max(idx, 0), Math.max(0, slides.length - visible)))
  }

  const nextSlide = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  const prevSlide = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))


  useEffect(() => {
    if (loading || length <= visible || isInteracting) return
    const id = setInterval(() => {
      nextSlide()
    }, 3500)
    return () => clearInterval(id)
  }, [loading, length, visible, maxIndex, isInteracting])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (length <= visible) return
    setIsInteracting(true)
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragOffset(0)
    pointerIdRef.current = e.pointerId
    hasCapturedPointerRef.current = false
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartX
    setDragOffset(deltaX)

    if (
      !hasCapturedPointerRef.current &&
      sliderRef.current &&
      pointerIdRef.current !== null &&
      Math.abs(deltaX) > 4
    ) {
      try {
        sliderRef.current.setPointerCapture(pointerIdRef.current)
        hasCapturedPointerRef.current = true
      } catch {
        // Ignore capture errors (e.g. not supported)
      }
    }
  }
  const endDrag = () => {
    if (!isDragging) {
      pointerIdRef.current = null
      hasCapturedPointerRef.current = false
      return setIsInteracting(false)
    }
    const threshold = 50
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0) nextSlide()
      else prevSlide()
    }
    setIsDragging(false)
    setDragOffset(0)

    if (pointerIdRef.current !== null && sliderRef.current) {
      try {
        if (sliderRef.current.hasPointerCapture(pointerIdRef.current)) {
          sliderRef.current.releasePointerCapture(pointerIdRef.current)
        }
      } catch {
        // Ignore release errors
      }
    }
    pointerIdRef.current = null
    hasCapturedPointerRef.current = false
    setTimeout(() => setIsInteracting(false), 100)
  }

  return (
    <section className="md:py-16 pt-10 pb-5 lg:pt-24 lg:pb-5 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:mb-4 mb-0 ">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 text-balance bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm mb-4">
            ความสำเร็จลูกศิษย์พี่เต้ย (อ.เชษฐา)
          </h2>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            ภูมิใจกับความสำเร็จของนักเรียน
            <br className="block md:hidden" />
            ที่ติดมหาวิทยาลัยชั้นนำทั่วประเทศ
          </p>
        </div>

 
        {loading ? (
          <div className="overflow-hidden mx-4 sm:mx-8">
            <div className="flex">
              {Array.from({ length: visible }).map((_, i) => (
                <div key={i} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-3">
                  <div className="aspect-[3/4] md:aspect-[4/5] rounded-lg shimmer" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-hidden mx-4 sm:mx-8">
              <div
                ref={sliderRef}
                className={`flex ${isDragging ? "" : "transition-transform duration-300 ease-in-out"}`}
                style={{
                  transform: `translateX(calc(-${currentIndex * (100 / visible)}% + ${dragOffset}px))`,
                  touchAction: "pan-y",
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onPointerLeave={endDrag}
              >
                {slides.map((success) => (
                  <div
                    key={success.id}
                    className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-3"
                  >
                    <Card className="h-full border-none shadow-none">
                      <CardContent className="p-0">
                        <div
                          className="aspect-[3/4] md:aspect-[4/5] relative overflow-hidden rounded-lg group cursor-pointer"
                          onClick={() =>
                            openModal({
                              src: success.image || "/placeholder.svg",
                              alt: success.image ? "student success image" : "no image",
                            })
                          }
                        >
                          <Image
                            src={success.image || "/placeholder.svg"}
                            alt={success.image ? "student success image" : "no image"}
                            fill
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-background/80 rounded-full p-2 transform scale-75 group-hover:scale-100 transition-transform">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                              >
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14 21 3"></path>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots 
            {length > visible && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: Math.max(0, length - visible) + 1 }).map((_, i) => (
                  <button
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                      i === currentIndex ? "bg-yellow-400" : "bg-gray-300"
                    }`}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </div>
            )} */}
          </div>
        )}
      </div>

      <ImageModal isOpen={isModalOpen} onClose={closeModal} image={selectedImage} />

   
      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            rgba(229, 229, 229, 1) 0%,
            rgba(243, 244, 246, 1) 50%,
            rgba(229, 229, 229, 1) 100%
          );
          background-size: 200% 100%;
          animation: shimmerSlide 1.4s ease-in-out infinite;
        }
        @keyframes shimmerSlide {
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
