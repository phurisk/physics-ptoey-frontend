"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Users, BookOpen, Clock, Play, ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

type ApiCourse = {
  id: string
  title: string
  description: string
  price: number
  duration: string | null
  isFree: boolean
  status: string
  instructorId: string
  categoryId: string
  coverImageUrl: string | null
  createdAt: string
  updatedAt: string
  instructor?: { id: string; name: string; email: string }
  category?: { id: string; name: string; description?: string }
  _count?: { enrollments: number; chapters: number }
}

type ApiResponse = {
  success: boolean
  data: ApiCourse | null
}

const COURSE_API = (id: string) => `/api/courses/${encodeURIComponent(id)}`
const CHAPTERS_API = (id: string) => `/api/courses/${encodeURIComponent(id)}/chapters`

type ApiChapter = {
  id: string
  title: string
  order?: number
  isFreePreview?: boolean
  duration?: number | null
}

type ChaptersResponse = {
  success: boolean
  data: ApiChapter[]
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [chapters, setChapters] = useState<ApiChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        // Fetch course detail first
        const res = await fetch(COURSE_API(id), { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ApiResponse = await res.json()
        if (active) setCourse(json.data || null)

        // If API includes chapters inline, use them; otherwise try chapters endpoint
        const inlineChapters = (json.data as any)?.chapters as ApiChapter[] | undefined
        if (inlineChapters && Array.isArray(inlineChapters)) {
          if (active) setChapters(inlineChapters)
        } else {
          try {
            const cRes = await fetch(CHAPTERS_API(id), { cache: "no-store" })
            if (cRes.ok) {
              const cJson: ChaptersResponse = await cRes.json()
              if (active) setChapters(cJson.data || [])
            }
          } catch {}
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load course")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  const totalMinutes = useMemo(() => {
    if (typeof course?.duration === "number") return course.duration
    const sum = chapters.reduce((acc, c) => acc + (typeof c.duration === "number" ? c.duration : 0), 0)
    return sum > 0 ? sum : null
  }, [course?.duration, chapters])

  const formatMinutes = (mins: number) => {
    if (!Number.isFinite(mins)) return "-"
    if (mins < 60) return `${mins} นาที`
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าคอร์สเรียนทั้งหมด
            </Button>
          </Link>
        </div>
        {loading && (
          <div className="text-center text-gray-600">กำลังโหลดรายละเอียดคอร์ส...</div>
        )}
        {!loading && error && (
          <div className="text-center text-red-600">เกิดข้อผิดพลาด: {error}</div>
        )}
        {!loading && !error && !course && (
          <div className="text-center text-gray-600">ไม่พบคอร์สนี้</div>
        )}
        {!loading && !error && course && (
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <div className="aspect-video relative overflow-hidden rounded-xl shadow-lg mb-6">
                <Image
                  src={course.coverImageUrl || "/placeholder.svg?height=400&width=700"}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-white">
                    <Play className="h-6 w-6 mr-2" />
                    ดูตัวอย่าง
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-yellow-400 text-white">{course.category?.name ?? "คอร์ส"}</Badge>
                {course.instructor?.name && <Badge variant="outline">{course.instructor?.name}</Badge>}
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">{course.title}</h1>

              <p className="text-xl text-gray-600 mb-6 text-pretty">{course.description}</p>


              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{course._count?.enrollments ?? 0} นักเรียน</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course._count?.chapters ?? 0} บทเรียน</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.duration ?? "-"}</span>
                </div>
              </div>
            </motion.div>

            {/* Course Overview */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-end justify-between gap-4">
                    <CardTitle className="text-2xl">Course Overview</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="inline-flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> {chapters.length} บทเรียน
                      </div>
                      {typeof totalMinutes === "number" && (
                        <div className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {formatMinutes(totalMinutes)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chapters.length === 0 ? (
                    <div className="text-gray-500">ยังไม่มีบทเรียน</div>
                  ) : (
                    <div className="space-y-3">
                      {chapters
                        .slice()
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((ch, idx) => {
                          const number = (ch.order ?? idx + 1).toString().padStart(2, "0")
                          return (
                            <div
                              key={ch.id}
                              className="group flex items-center justify-between p-4 rounded-xl border bg-white hover:bg-yellow-50/60 transition-colors"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-9 w-9 rounded-full bg-yellow-400 text-white flex items-center justify-center font-semibold shadow-sm">
                                  {number}
                                </div>
                                <div className="truncate">
                                  <div className="font-medium text-gray-900 truncate">{ch.title}</div>
                                  {ch.isFreePreview && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                                      ตัวอย่างฟรี
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600 shrink-0">
                                {typeof ch.duration === "number" && (
                                  <div className="inline-flex items-center gap-1">
                                    <Clock className="h-4 w-4" /> {ch.duration} นาที
                                  </div>
                                )}
                                {ch.isFreePreview ? (
                                  <Button variant="ghost" size="sm" className="text-[#004B7D] hover:bg-[#004B7D1A]">
                                    <Play className="h-4 w-4 mr-1" /> ดูตัวอย่าง
                                  </Button>
                                ) : (
                                  <div className="inline-flex items-center gap-1 text-gray-400">
                                    <Lock className="h-4 w-4" /> เฉพาะผู้ลงทะเบียน
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* No rating data from API; hide rating block */}
          </div>


          <div className="lg:col-span-1">
            <motion.div
              className="sticky top-24"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg">
                <CardContent className="p-6">

                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {course.isFree || course.price === 0 ? (
                        <span className="text-3xl font-bold text-green-600">ฟรี</span>
                      ) : (
                        <span className="text-3xl font-bold text-yellow-600">฿{(course.price || 0).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <Separator className="mb-6" />


                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ระยะเวลา:</span>
                      <span className="font-medium">{course.duration ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">บทเรียน:</span>
                      <span className="font-medium">{course._count?.chapters ?? 0} บทเรียน</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">นักเรียน:</span>
                      <span className="font-medium">{course._count?.enrollments ?? 0} คน</span>
                    </div>
                  </div>


                  <div className="space-y-3">
                    <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg py-3">
                      สมัครเรียนเลย
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      เพิ่มในรายการโปรด
                    </Button>
                  </div>

                  <Separator className="my-6" />


                  <div className="text-center text-sm text-gray-600">
                    <p>รับประกันความพึงพอใจ 30 วัน</p>
                    <p>หรือคืนเงิน 100%</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
