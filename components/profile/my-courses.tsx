"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, Clock, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import http from "@/lib/http"

type ChapterSlim = {
  id: string
  title: string
  order?: number
  contents?: { id: string }[]
}

type PaidCourse = {
  id: string
  title: string
  description?: string | null
  coverImageUrl?: string | null
  purchaseDate?: string | null
  paymentMethod?: string | null
  category?: { id: string; name: string }
  instructor?: { id: string; name: string }
  _count?: { chapters: number; enrollments: number }
  
  progress?: number | null
  chapters?: ChapterSlim[]
  enrollmentStatus?: string | null
  isExpire?: boolean | null
}

type MyCoursesResponse = {
  success: boolean
  courses: PaidCourse[]
  count: number
  message?: string
}


type ProgressAPI =
  | { success?: boolean; data?: { percent?: number; progress?: number; complete?: boolean }; percent?: number; progress?: number; complete?: boolean }
  | any

export default function MyCourses() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<PaidCourse[]>([])


  const [progressMap, setProgressMap] = useState<Record<string, { percent: number; complete: boolean }>>({})
  const [reloadKey, setReloadKey] = useState(0)
  const ensuringRef = useRef(false)
  const ensuredCourseIdsRef = useRef<Set<string>>(new Set())


  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) {
        if (!authLoading) {
          setLoading(false)
          setCourses([])
        }
        return
      }
      try {
        setLoading(true)
        const res = await http.get(`/api/my-courses`, {
          params: { userId: user.id, includeCompleted: true },
        })
        const json: MyCoursesResponse = res.data || { success: false, courses: [], count: 0 }
        if ((res.status < 200 || res.status >= 300) || json.success === false) throw new Error((json as any)?.error || "โหลดคอร์สไม่สำเร็จ")
        if (active) {
          setCourses(json.courses || [])
          if (Array.isArray(json.courses)) {
            json.courses.forEach((c) => {
              if (c?.id) ensuredCourseIdsRef.current.add(c.id)
            })
          }
          setError(null)
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดคอร์สไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user?.id, authLoading, reloadKey])

  useEffect(() => {
    if (!user?.id || authLoading) return
    if (loading) return
    if (ensuringRef.current) return

    const ensureEnrollments = async () => {
      ensuringRef.current = true
      try {
        const res = await http.get(`/api/orders`, { params: { userId: user.id } })
        const payload = res.data
        const orders: any[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []

        if (!Array.isArray(orders) || orders.length === 0) return

        const existingCourseIds = new Set(courses.map((c) => c.id))
        let createdAny = false

        for (const order of orders) {
          const paymentStatus = String(order?.payment?.status ?? "").toUpperCase()
          const orderStatus = String(order?.status ?? "").toUpperCase()
          const isPaid = ["COMPLETED", "APPROVED"].includes(paymentStatus) || orderStatus === "COMPLETED"
          if (!isPaid) continue

          const courseIds = new Set<string>()

          if (order?.course?.id) courseIds.add(String(order.course.id))

          if (Array.isArray(order?.items)) {
            for (const item of order.items) {
              const type = String(item?.itemType ?? "").toUpperCase()
              if (type !== "COURSE") continue
              const cid = item?.itemId ?? item?.courseId
              if (cid) courseIds.add(String(cid))
            }
          }

          if (courseIds.size === 0) continue

          for (const courseId of courseIds) {
            if (!courseId) continue
            if (existingCourseIds.has(courseId)) {
              ensuredCourseIdsRef.current.add(courseId)
              continue
            }
            if (ensuredCourseIdsRef.current.has(courseId)) continue

            try {
              await http.post(`/api/enrollments`, { userId: user.id, courseId })
              ensuredCourseIdsRef.current.add(courseId)
              createdAny = true
            } catch (err) {
              console.error("Failed to create missing enrollment", err)
            }
          }
        }

        if (createdAny) {
          setReloadKey((key) => key + 1)
        }
      } catch (err) {
        console.error("Failed to sync enrollments from orders", err)
      } finally {
        ensuringRef.current = false
      }
    }

    ensureEnrollments()
  }, [user?.id, authLoading, loading, courses])


  useEffect(() => {
    let active = true
    const fetchProgress = async () => {
      if (!user?.id || courses.length === 0) return

      try {
        const results = await Promise.all(
          courses.map(async (c) => {
            if (c.isExpire) {
              return [c.id, { percent: 0, complete: false }] as const
            }
            if (c.progress !== undefined && c.progress !== null) {
              let p = Number(c.progress) || 0
              if (p > 0 && p <= 1) p = p * 100
              const percent = Math.max(0, Math.min(100, Math.round(p)))
              return [c.id, { percent, complete: percent >= 100 }] as const
            }

            try {
              const res = await http.get(`/api/progress`, { params: { userId: user.id!, courseId: c.id } })
              const json: ProgressAPI = res.data || {}
              const raw = json?.data ?? json
              const pRaw = raw?.percent ?? raw?.progress ?? 0
              let pNum = Number(pRaw) || 0
              if (pNum > 0 && pNum <= 1) pNum = pNum * 100
              const percent = Math.max(0, Math.min(100, Math.round(pNum)))
              const complete = Boolean(raw?.complete ?? percent >= 100)
              return [c.id, { percent, complete }] as const
            } catch {
              return [c.id, { percent: 0, complete: false }] as const
            }
          })
        )
        if (!active) return
        setProgressMap(Object.fromEntries(results))
      } catch {
        
      }
    }

    fetchProgress()
    return () => {
      active = false
    }
   
  }, [user?.id, courses])

 
  const formatTHDate = (iso?: string | null) => {
    if (!iso) return ""
    try {
      return new Date(iso).toLocaleDateString("th-TH")
    } catch {
      return ""
    }
  }

  if (authLoading && !user?.id) {
    return (
      <div className="py-12 flex items-center justify-center gap-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
        <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
      </div>
    )
  }

  return (
    <div>
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`sk-${i}`} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video relative">
                  <Skeleton className="absolute inset-0" />
                </div>
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/5 bg-yellow-400 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && <div className="text-red-600">เกิดข้อผิดพลาด: {error}</div>}

      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, i) => {
            const chaptersCount = c._count?.chapters ?? c.chapters?.length ?? 0 
            const prog = progressMap[c.id]
            const percent = prog?.percent ?? 0
            const complete = prog?.complete ?? false
            const expired = Boolean(c.isExpire)

            return (
              <Card key={c.id} className="overflow-hidden group p-0">
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden border-b">
                    <Image
                      src={c.coverImageUrl || "/placeholder.svg?height=200&width=350"}
                      alt={c.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={i === 0}
                      fetchPriority={i === 0 ? "high" : undefined}
                    />
                    {c.category?.name && (
                      <Badge className="absolute top-3 left-3 bg-yellow-400 text-white">
                        {c.category.name}
                      </Badge>
                    )}
                    {expired && (
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white">
                        หมดอายุ
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="font-semibold text-gray-900 line-clamp-2">{c.title}</div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="inline-flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {chaptersCount} บทเรียน
                      </div>
                      {c.purchaseDate && (
                        <div className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTHDate(c.purchaseDate)}
                        </div>
                      )}
                    </div>

                    
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>ความคืบหน้า</span>
                        <span className="font-medium">{percent}%</span>
                      </div>
                      <div
                        className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ${expired ? "bg-gray-300" : "bg-yellow-400"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {complete && !expired && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <Check className="h-3.5 w-3.5" />
                          เรียนจบแล้ว
                        </div>
                      )}
                      {expired && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          คอร์สหมดอายุแล้ว
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      {expired ? (
                        <Button className="bg-gray-200 text-gray-500 cursor-not-allowed" disabled>
                          คอร์สหมดอายุ
                        </Button>
                      ) : (
                        <Link href={`/profile/my-courses/course/${c.id}`}>
                          <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">เข้าเรียน</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📚</div>
          <div className="text-lg font-medium text-gray-700 mb-2">ยังไม่มีคอร์สที่ซื้อ</div>
          <div className="text-gray-600 mb-4">เริ่มเรียนรู้ได้เลย เลือกคอร์สที่สนใจ</div>
          <Link href="/courses">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">ดูคอร์สทั้งหมด</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
