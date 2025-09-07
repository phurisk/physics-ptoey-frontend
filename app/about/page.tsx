"use client"

import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Award, Users, BookOpen, Target } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

const teachingEnvironmentImages = [
  {
    id: 1,
    src: "/view1.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 2,
    src: "/view2.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 3,
    src: "/view3.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 4,
    src: "/view4.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 5,
    src: "/view5.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 6,
    src: "/view6.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 7,
    src: "/view7.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
  {
    id: 8,
    src: "/view8.jpeg",
    alt: "บรรยากาศการเรียนในห้องเรียน",
    title: "บรรยากาศการเรียนในห้องเรียน",
  },
]

const achievements = [
  "ที่ 1 ฟิสิกส์สามัญ ประเทศ",
  "ชนะเลิศการแข่งขันฟิสิกส์สัประยุทธ์ กลุ่มภาคกลางและกลุ่มภาคตะวันออก",
  "ที่ 1 ชนะเลิศการตอบปัญหาวิศวกรรมศาสตร์ (มหาวิทยาลัยเกษตรศาสตร์)",
  "นักเรียนฟิสิกส์โอลิมปิค มหาวิทยาลัยศิลปากร (สนามจันทร์)",
  "นักเรียนทุนส่งเสริมความเป็นเลิศทางวิทยาศาสตร์และเทคโนโลยี JSTP ของสวทช และอพวช",
  "รับเชิญเข้าร่วมประชุมสัมนาฟิสิกส์ศึกษา เกี่ยวกับการเรียนการสอนและงานวิจัยด้านฟิสิกส์ศึกษาของประเทศไทย",
]

const currentPositions = ["อาจารย์ฟิสิกส์ สถาบันฟิสิกส์ อ.เต้ย", "อาจารย์พิเศษห้องเรียนพิเศษทั่วประเทศ"]

export default function AboutPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [images, setImages] = useState(teachingEnvironmentImages)

  // Load images from API (postType: บรรยากาศการเรียน)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const params = new URLSearchParams({ postType: "บรรยากาศการเรียน" })
        const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" })
        if (res.ok) {
          console.log("[About] Fetch /api/posts: OK", res.status)
        } else {
          console.warn("[About] Fetch /api/posts: NOT OK", res.status, res.statusText)
        }
        const json: any = await res.json().catch(() => null)

        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
        if (!list.length) {
          console.warn(
            `[About] API ไม่มีข้อมูลโพสต์ ใช้รูป dummy แทน (${teachingEnvironmentImages.length} ภาพ)`
          )
          return
        } else {
          console.log(`[About] Posts loaded: ${list.length}`)
        }

        const mapped = list
          .map((p: any, idx: number) => ({
            id: p?.id ?? idx,
            src: p?.imageUrl || p?.imageUrlMobileMode || "",
            alt: p?.title || "บรรยากาศการเรียน",
            title: p?.title || "บรรยากาศการเรียน",
          }))
          .filter((s: { id: string | number; src: string }) => !!s.src)

        console.log(`[About] Slides mapped: ${mapped.length}`)

        if (mounted && mapped.length) {
          setImages(mapped as any)
          setCurrentImageIndex(0)
          console.log(`[About] ใช้รูปจาก API จำนวน ${mapped.length} ภาพ`)
        } else if (mounted) {
          console.warn(
            `[About] API ไม่มีรูป (imageUrl/imageUrlMobileMode) ใช้รูป dummy แทน (${teachingEnvironmentImages.length} ภาพ)`
          )
        }
      } catch (err) {
        console.error("[About] Failed to load posts", err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-12 md:pt-24 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4 lg:mb-16">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">เกี่ยวกับเรา</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">โรงเรียนกวดวิชาฟิสิกส์อาจารย์เต้ย</p>
              <p className="text-lg text-gray-500 mt-2">(ในความควบคุมของกระทรวงศึกษาธิการ)</p>
            </div>
          </div>
        </motion.section>


        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="py-5 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              <div className="relative">
                <div className="relative max-w-[250px] mx-auto rounded-2xl overflow-hidden shadow-2xl md:max-w-none md:w-full md:h-190">
                  <Image
                    src="/profile_about.png"
                    alt="อาจารย์เต้ย (อ.เชษฐา)"
                    width={1200}
                    height={1500}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="w-full h-auto md:h-full md:object-cover"
                    priority
                  />
                </div>


                <div className="absolute -bottom-4 right-12 md:-bottom-6 md:-right-6 bg-yellow-400 text-white p-3 md:p-4 rounded-2xl shadow-lg">
                  <Award className="h-6 w-6 md:h-8 md:w-8" />
                </div>
              </div>



              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">ฟิสิกส์ พี่เต้ย</h2>
                  <p className="text-xl text-gray-600 mb-4">อาจารย์เชษฐา</p>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    ผู้เชี่ยวชาญด้านฟิสิกส์
                  </Badge>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="h-6 w-6 text-yellow-500" />
                    ประวัติ / ประสบการณ์การสอน
                  </h3>
                  <div className="space-y-3">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700 leading-relaxed">{achievement}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-6 w-6 text-yellow-500" />
                    ปัจจุบัน
                  </h3>
                  <div className="space-y-3">
                    {currentPositions.map((position, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + 0.1 * index }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-700 leading-relaxed">{position}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>


        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="py-16 px-4 bg-white"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">บรรยากาศการสอน</h2>
              <p className="text-xl text-gray-600">สภาพแวดล้อมการเรียนรู้ที่เอื้อต่อการพัฒนาศักยภาพ</p>
            </div>

            <div className="relative">
              <Card className="overflow-hidden shadow-2xl p-0">
                <CardContent className="p-0 ">
                  <div className="relative h-96 md:h-[500px]">
                    <Image
                      src={images[currentImageIndex]?.src || "/placeholder.svg"}
                      alt={images[currentImageIndex]?.alt || ""}
                      fill
                      className="object-cover transition-all duration-500 "
                    />


                    <Button
                      onClick={prevImage}
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={nextImage}
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>


                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <h3 className="text-white text-xl font-semibold">
                        {images[currentImageIndex]?.title}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <div className="flex justify-center mt-6 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? "bg-yellow-400 scale-125" : "bg-gray-300 hover:bg-gray-400"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.section>


        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}

          className="py-6 sm:py-8 md:py-12 lg:py-16 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-yellow-400 to-yellow-500"
        >
          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 text-center">


              <div className="text-white">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">1000+</h3>
                <p className="text-sm sm:text-base md:text-lg leading-snug">
                  นักเรียนที่ประสบความสำเร็จ
                </p>
              </div>


              <div className="text-white">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">15+</h3>
                <p className="text-sm sm:text-base md:text-lg leading-snug">
                  ปีของประสบการณ์การสอน
                </p>
              </div>


              <div className="text-white">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-2 sm:mb-3 md:mb-4" />
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">50+</h3>
                <p className="text-sm sm:text-base md:text-lg leading-snug">
                  รางวัลและความสำเร็จ
                </p>
              </div>

            </div>
          </div>
        </motion.section>

      </main>

      <Footer />
    </>
  )
}
