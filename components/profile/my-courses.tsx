"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"

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
}

type MyCoursesResponse = {
  success: boolean
  courses: PaidCourse[]
  count: number
  message?: string
}

export default function MyCourses() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<PaidCourse[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetch(`/api/my-courses?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" })
        const json: MyCoursesResponse = await res.json().catch(() => ({ success: false, courses: [], count: 0 }))
        if (!res.ok || json.success === false) throw new Error((json as any)?.error || "โหลดคอร์สไม่สำเร็จ")
        if (active) setCourses(json.courses || [])
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
  }, [user?.id])

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
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="text-red-600">เกิดข้อผิดพลาด: {error}</div>
      )}
      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Card key={c.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden border-b">
                  <Image 
                    src={c.coverImageUrl || "/placeholder.svg?height=200&width=350"}
                    alt={c.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {c.category?.name && (
                    <Badge className="absolute top-3 left-3 bg-yellow-400 text-white">{c.category.name}</Badge>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="font-semibold text-gray-900 line-clamp-2">{c.title}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" />{c._count?.chapters ?? 0} บทเรียน</div>
                    {c.purchaseDate && (
                      <div className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(c.purchaseDate).toLocaleDateString("th-TH")}</div>
                    )}
                  </div>
                  <div className="pt-1">
                    <Link href={`/profile/my-courses/course/${c.id}`}>
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">เข้าเรียน</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
