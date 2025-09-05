"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type Ebook = {
  id: string
  title: string
  description?: string | null
  author?: string | null
  price: number
  discountPrice: number
  coverImageUrl?: string | null
  averageRating?: number
}

export default function Books() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        // Use same-origin proxy route to avoid CORS
        const res = await fetch(`/api/ebooks`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          setEbooks(Array.isArray(json?.data) ? json.data : [])
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const calculateDiscount = (original: number, discounted: number) => {
    if (!original || original <= 0) return 0
    return Math.round(((original - discounted) / original) * 100)
  }

  return (
    <section className="py-12 lg:py-24 bg-white"> 
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
    
        <div className="text-center mb-8 lg:mb-12"> 
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 text-balance bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm"> 
            หนังสือของเรา
          </h2>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto text-pretty"> 
            หนังสือเรียนฟิสิกส์คุณภาพสูง เขียนโดยอาจารย์เต้ย พร้อมเทคนิคการแก้โจทย์ที่เข้าใจง่าย
          </p>
        </div>

     
        <div
          className="
            grid grid-cols-1        /* MOBILE: 1 คอลัมน์ (แสดงทีละเล่ม) */
            md:grid-cols-2          /* tablet เหมือนเดิม */
            lg:grid-cols-4          /* desktop เหมือนเดิม */
            gap-4 md:gap-8          /* MOBILE: ลดช่องไฟ */
          "
        >
          {loading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className="overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Cover skeleton */}
                    <div className="relative">
                      <div className="aspect-[640/906] w-full overflow-hidden">
                        <Skeleton className="h-full w-full" />
                      </div>
                      {/* Discount badge skeleton */}
                      <Skeleton className="absolute top-2 right-2 lg:top-4 lg:right-4 h-5 w-12 rounded-full" />
                    </div>

                    {/* Content skeleton */}
                    <div className="p-3 md:p-6 space-y-3 md:space-y-4">
                      {/* Title lines */}
                      <Skeleton className="h-4 md:h-5 w-4/5" />
                      <Skeleton className="hidden md:block h-4 w-3/5" />

                      {/* Rating row */}
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-10" />
                      </div>

                      {/* Price row */}
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 md:h-7 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>

                      {/* CTA button */}
                      <Skeleton className="h-9 md:h-11 w-full rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
          {!loading && error && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-red-600 py-10">
              โหลดข้อมูลไม่สำเร็จ: {error}
            </div>
          )}
          {!loading && !error && ebooks.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-gray-500 py-10">
              ยังไม่มีรายการหนังสือ
            </div>
          )}
          {!loading && !error && ebooks.map((book) => (
            <Card
              key={book.id}
              className="
                group hover:shadow-xl transition-all duration-300 overflow-hidden pt-0
              "
            >
              <CardContent className="p-0">
            
                <div className="aspect-[640/906] relative overflow-hidden">
                  <Image
                    src={book.coverImageUrl || "/placeholder.svg"}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                 
                  <Badge
                    className="
                      absolute top-2 right-2 lg:top-4 lg:right-4  /* MOBILE-ONLY: ขยับ badge ชิดขอบน้อยลง */
                      bg-red-500 text-white text-[10px] lg:text-xs /* MOBILE-ONLY: ย่อฟอนต์ */
                      px-1.5 py-0.5 lg:px-2 lg:py-0.5              /* MOBILE-ONLY: ย่อ padding */
                    "
                  >
                    -{calculateDiscount(book.price, book.discountPrice)}%
                  </Badge>
                </div>

               
                <div className="p-3 md:p-6"> 
                  <h3 className="text-sm md:text-xl font-semibold text-gray-900 mb-2 md:mb-3 text-balance line-clamp-2">
                
                    {book.title}
                  </h3>

               
                  <p className="hidden md:block text-gray-600 mb-4 text-pretty leading-relaxed line-clamp-2 lg:line-clamp-3">
                    {book.description || ""}
                  </p>

               
                  <div className="flex items-center mb-3 md:mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs md:text-sm text-gray-500 ml-2">({(book.averageRating ?? 0).toFixed(1)})</span>
                  </div>

                 
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg md:text-2xl font-bold text-yellow-600">
                        ฿{book.discountPrice}
                      </span>
                      <span className="text-sm md:text-lg text-gray-400 line-through">
                        ฿{book.price}
                      </span>
                    </div>
                  </div>

                
                  <Button
                    className="
                      w-full bg-yellow-400 hover:bg-yellow-500 text-white font-medium
                      py-2 md:py-3 text-sm md:text-base  /* MOBILE-ONLY: ปุ่มเตี้ยลง + ฟอนต์เล็กลง */
                    "
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    สั่งซื้อเลย
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      
        <div className="text-center mt-10 lg:mt-12"> 
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
            ต้องการหนังสือเพิ่มเติม หรือมีคำถามเกี่ยวกับหนังสือ?
          </p>
          <Button
            variant="outline"
            size="lg"
            className="
              border-yellow-400 text-yellow-600 hover:bg-yellow-50 bg-transparent
              h-10 px-4 text-sm md:h-12 md:px-6 md:text-base  /* MOBILE-ONLY: ปรับขนาดปุ่ม */
            "
          >
            ติดต่อสอบถาม
          </Button>
        </div>
      </div>
    </section>
  )
}
