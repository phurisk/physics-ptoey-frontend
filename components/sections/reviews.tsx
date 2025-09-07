"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { reviews as fallbackReviews } from "@/lib/dummy-data"


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

export default function Reviews() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(3) 
  const [slides, setSlides] = useState<{ id: string | number; image: string }[]>(fallbackReviews)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)
  
    const openModal = (img: { src: string; alt: string }) => {
      setSelectedImage(img)
      setIsModalOpen(true)
      document.body.style.overflow = "hidden"
    }
    const closeModal = () => {
      setIsModalOpen(false)
      setSelectedImage(null)
      document.body.style.overflow = "auto"
    }


  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth
      if (w < 768) setVisible(1)
      else if (w < 1024) setVisible(2)
      else setVisible(4)
    }
    updateVisible()
    window.addEventListener("resize", updateVisible)
    return () => window.removeEventListener("resize", updateVisible)
  }, [])

 
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const params = new URLSearchParams({ postType: "รีวิวจากน้องๆ" })
        const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" })
        if (res.ok) {
          console.log("[Reviews] Fetch /api/posts: OK", res.status)
        } else {
          console.warn("[Reviews] Fetch /api/posts: NOT OK", res.status, res.statusText)
        }
        const json: any = await res.json().catch(() => null)

        const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
        if (!items.length) {
          console.warn(
            `[Reviews] API ไม่มีข้อมูลโพสต์ ใช้รูป dummy แทน (${fallbackReviews.length} ภาพ)`
          )
          return
        } else {
          console.log(`[Reviews] Posts loaded: ${items.length}`)
        }

        const mapped = items
          .map((p: any, idx: number) => ({
            id: p?.id ?? idx,
            image: p?.imageUrl || p?.imageUrlMobileMode || "",
          }))
          .filter((s: { id: string | number; image: string }) => !!s.image)

        console.log(`[Reviews] Slides mapped: ${mapped.length}`)

        if (mounted && mapped.length) {
          setSlides(mapped)
          console.log(`[Reviews] ใช้รูปจาก API จำนวน ${mapped.length} ภาพ`)
        } else if (mounted) {
          console.warn(
            `[Reviews] API ไม่มีรูป (imageUrl/imageUrlMobileMode) ใช้รูป dummy แทน (${fallbackReviews.length} ภาพ)`
          )
        }
      } catch (err) {
        console.error("[Reviews] Failed to load posts", err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const length = slides.length
  const maxIndex = Math.max(0, length - visible)


  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex))
  }, [visible, maxIndex])

  const nextSlide = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  const prevSlide = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 text-balance bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm">
            รีวิวจากน้องๆ ทั่วประเทศ
          </h2>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            ฟังเสียงจากนักเรียนที่ประสบความสำเร็จในการเรียนฟิสิกส์กับเรา
          </p>
        </div>


        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50 p-2"
            onClick={prevSlide}
            disabled={length <= visible}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-50 p-2"
            onClick={nextSlide}
            disabled={length <= visible}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="overflow-hidden mx-8">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / visible)}%)` }}
            >
              {slides.map((review) => (
                <div key={review.id} className="w-full md:w-1/2 lg:w-1/4 flex-shrink-0 px-3">
                  <Card className="h-full border-none shadow-none">
                    <CardContent className="p-0">
                
                      <div
                        className="aspect-square relative overflow-hidden rounded-lg group cursor-pointer"
                        onClick={() =>
                          openModal({ src: review.image || "/placeholder.svg", alt: review.image ? "review image" : "no image" })
                        }
                      >
                        <Image
                          src={review.image || "/placeholder.svg"}
                          alt={review.image ? "review image" : "no image"}
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

          {/* Dots */}
          {/* {length > visible && (
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
      </div>
  
      <ImageModal isOpen={isModalOpen} onClose={closeModal} image={selectedImage} />
    </section>
  )
}
