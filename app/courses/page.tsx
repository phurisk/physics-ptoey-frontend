"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Star, Users, BookOpen, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, BookOpen as BookIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"
import { useSearchParams } from "next/navigation"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
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
  subject?: string | null
}

type ApiResponse = {
  success: boolean
  data: ApiCourse[]
}

const COURSES_API = "/api/courses"

export default function CoursesPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [data, setData] = useState<ApiCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(COURSES_API, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ApiResponse = await res.json()
        if (active) setData(json.data || [])
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load courses")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    void searchParams; void data
  }, [data, searchParams])

  const levels = useMemo(() => (
    [
      { id: "all", name: "ทุกระดับ" },
      { id: "middle", name: "คอร์ส ม.ต้น" },
      { id: "high", name: "คอร์ส ม.ปลาย" },
      { id: "competition", name: "คอร์สแข่งขัน" },
    ]
  ), [])

  const subjects = useMemo(() => (
    [
      { id: "all", name: "ทุกวิชา" },
      { id: "ฟิสิกส์", name: "ฟิสิกส์" },
      { id: "คณิตศาสตร์", name: "คณิตศาสตร์" },
      { id: "เคมี", name: "เคมี" },
      { id: "ชีววิทยา", name: "ชีววิทยา" },
      { id: "ภาษาอังกฤษ", name: "ภาษาอังกฤษ" },
      { id: "ภาษาจีน", name: "ภาษาจีน" },
    ]
  ), [])

  const detectLevel = (c: ApiCourse): string | null => {
    const text = `${c.category?.name || ""} ${c.title || ""}`
    if (/แข่งขัน/.test(text)) return "competition"
    if (/ม\.ปลาย|ม\s*ปลาย/.test(text)) return "high"
    if (/ม\.ต้น|ม\s*ต้น/.test(text)) return "middle"
    return null
  }

  const detectSubject = (c: ApiCourse): string | null => {
    if (c.subject && typeof c.subject === "string" && c.subject.trim()) return c.subject.trim()
    const t = `${c.title || ""} ${c.description || ""}`
    const list = ["ฟิสิกส์","คณิตศาสตร์","เคมี","ชีววิทยา","ภาษาอังกฤษ","ภาษาจีน"]
    for (const s of list) {
      if (t.includes(s)) return s
    }
    return null
  }

  const filteredCourses = useMemo(() => {
    let list = data || []
    if (selectedLevel !== "all") list = list.filter((c) => detectLevel(c) === selectedLevel)
    if (selectedSubject !== "all") list = list.filter((c) => detectSubject(c) === selectedSubject)
    return list
  }, [data, selectedLevel, selectedSubject])

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 pt-0 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">คอร์สเรียนทั้งหมด</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
              เลือกคอร์สที่เหมาะกับระดับการศึกษาของคุณ เรียนกับอาจารย์เต้ยผู้เชี่ยวชาญ
            </p>
          </motion.div>

      
          {/* Removed category filter as requested */}

          <motion.div className="mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="flex items-center justify-center gap-2 text-gray-800 mb-3">
              <GraduationCap className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">เลือกระดับ</span>
            </div>
            <div className="hidden md:flex flex-wrap justify-center gap-3">
              {levels.map((l) => (
                <Button
                  key={l.id}
                  variant={selectedLevel === l.id ? "default" : "outline"}
                  className={`px-5 py-2 ${selectedLevel === l.id ? "bg-yellow-400 hover:bg-yellow-500 text-white" : "hover:bg-yellow-50 hover:border-yellow-400"}`}
                  onClick={() => setSelectedLevel(l.id)}
                >
                  {l.name}
                </Button>
              ))}
            </div>
            <div className="md:hidden max-w-xs mx-auto">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกระดับ" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
            <div className="flex items-center justify-center gap-2 text-gray-800 mb-3">
              <BookIcon className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">เลือกวิชา</span>
            </div>
            <div className="hidden md:flex flex-wrap justify-center gap-2">
              {subjects.map((s) => (
                <Button
                  key={s.id}
                  variant={selectedSubject === s.id ? "default" : "outline"}
                  className={`px-4 py-1.5 text-sm ${selectedSubject === s.id ? "bg-yellow-400 hover:bg-yellow-500 text-white" : "hover:bg-yellow-50 hover:border-yellow-400"}`}
                  onClick={() => setSelectedSubject(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
            <div className="md:hidden max-w-xs mx-auto">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกวิชา" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

       
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {loading && (
              Array.from({ length: 6 }).map((_, idx) => (
                <motion.div key={`skeleton-${idx}`} variants={fadeInUp}>
                  <Card className="h-full group pt-0">
                    <CardContent className="p-0">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <Skeleton className="absolute inset-0" />
                        <div className="absolute top-4 left-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
            {!loading && error && (
              <div className="col-span-full text-center text-red-600">เกิดข้อผิดพลาด: {error}</div>
            )}
            {!loading && !error && filteredCourses.map((course) => (
              <motion.div key={course.id} variants={fadeInUp}>
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 group pt-0">
                  <CardContent className="p-0">
                
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <Image
                        src={course.coverImageUrl || "/placeholder.svg?height=200&width=350"}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-400 text-white">{course.category?.name ?? "คอร์ส"}</Badge>
                      </div>
                    </div>

                 
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 text-balance line-clamp-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4 text-pretty line-clamp-2">{course.description}</p>

                     
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course._count?.enrollments ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{course._count?.chapters ?? 0} บทเรียน</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration ?? "-"}</span>
                        </div>
                      </div>

                      {/* No rating data from API; hide rating block */}

               
                      <div className="flex items-center gap-2 mb-6">
                        {course.isFree || course.price === 0 ? (
                          <span className="text-2xl font-bold text-green-600">ฟรี</span>
                        ) : (
                          <span className="text-2xl font-bold text-yellow-600">฿{(course.price || 0).toLocaleString()}</span>
                        )}
                      </div>

                   
                      <Link href={`/courses/${course.id}`}>
                        <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white">ดูรายละเอียด</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

      
          {!loading && !error && filteredCourses.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xl text-gray-500">ไม่พบคอร์สในหมวดหมู่นี้</p>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
