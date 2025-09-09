"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Users, BookOpen, Clock, Play, ArrowLeft, Lock, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import LoginModal from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"
// ถ้ามี Textarea ของ shadcn ให้ใช้ด้านล่างนี้; ถ้าไม่มี ใช้ <textarea> ธรรมดาได้
import { Textarea } from "@/components/ui/textarea"

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
  contents?: { id: string; title: string; contentType?: string; order?: number }[]
}

type ChaptersResponse = {
  success: boolean
  data: ApiChapter[]
}

// ---------- Reviews types ----------
type ApiReview = {
  id: string
  userId: string
  courseId?: string
  ebookId?: string
  rating: number
  title?: string
  comment?: string
  createdAt: string
  user?: { id: string; name: string; email?: string; avatarUrl?: string }
}

type ReviewsListResponse = {
  success: boolean
  data: ApiReview[]
  count?: number
}

type PostReviewResponse = {
  success: boolean
  data?: ApiReview
  error?: string
}
// -----------------------------------

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "h-5 w-5",
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: string
}) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => {
        const active = s <= Math.round(value)
        const base = "cursor-pointer transition-transform"
        const cls = active ? "text-yellow-500" : "text-gray-300"
        return (
          <button
            type="button"
            key={s}
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(s)}
            className={`${base} ${readOnly ? "cursor-default" : "hover:scale-110"}`}
            aria-label={`${s} ดาว`}
          >
            <Star className={`${size} ${cls} fill-current`} />
          </button>
        )
      })}
    </div>
  )
}

function formatThaiDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [chapters, setChapters] = useState<ApiChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [viewedIds, setViewedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState<number>(0)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; total: number } | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [enrolledOpen, setEnrolledOpen] = useState(false)
  const [slip, setSlip] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)

  // ---------- Reviews state ----------
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const REVIEWS_LIMIT = 5
  const [hasMoreReviews, setHasMoreReviews] = useState(true)

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [postingReview, setPostingReview] = useState(false)
  // -----------------------------------

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
      
        const res = await fetch(COURSE_API(id), { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ApiResponse = await res.json()
        if (active) setCourse(json.data || null)

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

  // load enrollment flag
  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        if (!isAuthenticated || !user?.id || !id) return
        const res = await fetch(`/api/my-courses?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json && Array.isArray(json.courses)) {
          const found = !!json.courses.find((c: any) => c.id === id)
          if (active) setIsEnrolled(found)
        }
      } catch {}
    }
    check()
    return () => { active = false }
  }, [isAuthenticated, user?.id, id])

  // load viewed content ids
  useEffect(() => {
    let active = true
    const loadEnrollment = async () => {
      try {
        if (!isAuthenticated || !user?.id || !id) return
        const res = await fetch(`/api/enrollments?userId=${encodeURIComponent(user.id)}&courseId=${encodeURIComponent(String(id))}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        const v = json?.enrollment?.viewedContentIds
        if (active && Array.isArray(v)) setViewedIds(v)
      } catch {}
    }
    loadEnrollment()
    return () => { active = false }
  }, [isAuthenticated, user?.id, id])

  // ---------- Load reviews ----------
  useEffect(() => {
    setReviews([])
    setReviewsPage(1)
    setHasMoreReviews(true)
    setReviewsError(null)
  }, [id])

  useEffect(() => {
    let active = true
    const loadReviews = async () => {
      if (!id || !hasMoreReviews || reviewsLoading) return
      try {
        setReviewsLoading(true)
        setReviewsError(null)
        const url = `/api/reviews?courseId=${encodeURIComponent(String(id))}&page=${reviewsPage}&limit=${REVIEWS_LIMIT}`
        const res = await fetch(url, { cache: "no-store" })
        const json: ReviewsListResponse = await res.json().catch(() => ({ success: false, data: [] }))
        if (!res.ok || json.success === false) throw new Error("โหลดรีวิวไม่สำเร็จ")
        if (active) {
          setReviews((prev) => [...prev, ...(json.data || [])])
          // ถ้ามี count ใช้คำนวณต่อได้; ถ้าไม่มี count ให้ใช้ความยาวของ page แทน
          const pageHasMore = (json.data?.length || 0) >= REVIEWS_LIMIT
          setHasMoreReviews(pageHasMore)
        }
      } catch (e: any) {
        if (active) setReviewsError(e?.message ?? "โหลดรีวิวไม่สำเร็จ")
      } finally {
        if (active) setReviewsLoading(false)
      }
    }
    loadReviews()
    return () => { active = false }
  }, [id, reviewsPage]) // eslint-disable-line
  // -----------------------------------

  const totalContents = useMemo(() => {
    return chapters.reduce((acc, ch) => acc + (Array.isArray(ch.contents) ? ch.contents.length : 0), 0)
  }, [chapters])

  const progressPercent = useMemo(() => {
    if (!totalContents) return 0
    const seen = viewedIds.length
    return Math.max(0, Math.min(100, Math.round((seen / totalContents) * 100)))
  }, [viewedIds, totalContents])

  const toggleContentViewed = async (contentId: string) => {
    if (!isAuthenticated || !user?.id || !id) { setLoginOpen(true); return }
    if (!isEnrolled) return
    const next = viewedIds.includes(contentId) ? viewedIds.filter((x) => x !== contentId) : [...viewedIds, contentId]
    setViewedIds(next)
    try {
      setSaving(true)
      await fetch(`/api/enrollments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, courseId: id, viewedContentIds: next })
      })
    } catch {}
    finally { setSaving(false) }
  }

  const totalMinutes = useMemo(() => {
    if (typeof course?.duration === "number") return course.duration as any
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

  const price = course?.isFree || (course?.price ?? 0) === 0 ? 0 : (course?.price ?? 0)
  const finalTotal = Math.max(0, (price || 0) - (discount || 0))

  const applyCoupon = async () => {
    if (!course) return
    if (!couponCode) { setCouponError("กรอกรหัสคูปอง"); return }
    try {
      setValidatingCoupon(true)
      setCouponError(null)
      const res = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          userId: user?.id ?? "guest",
          itemType: "course",
          itemId: course.id,
          subtotal: price,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "ใช้คูปองไม่สำเร็จ")
      setDiscount(Number(json?.data?.discount || 0))
    } catch (e: any) {
      setCouponError(e?.message ?? "ใช้คูปองไม่สำเร็จ")
      setDiscount(0)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const createOrder = async () => {
    if (!course) return
    if (!isAuthenticated) { setLoginOpen(true); return }
    try {
      setCreating(true)
      const res = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          itemType: "course",
          itemId: course.id,
          couponCode: couponCode || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "สร้างคำสั่งซื้อไม่สำเร็จ")
      if (json?.data?.isFree) {
        setOrderInfo({ orderId: json?.data?.orderId, total: 0 })
        setUploadMsg("ลงทะเบียนฟรีสำเร็จ")
      } else {
        setOrderInfo({ orderId: json?.data?.orderId, total: json?.data?.total })
        setUploadOpen(true)
      }
    } catch (e: any) {
      const msg = e?.message || "สร้างคำสั่งซื้อไม่สำเร็จ"
      if (msg.includes("ซื้อแล้ว") || msg.includes("ได้ซื้อ") || msg.includes("มีสินค้") || msg.includes("ซื้อคอร์สนี้แล้ว")) {
        setEnrolledOpen(true)
      } else {
        setCouponError(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  const uploadSlip = async () => {
    if (!orderInfo || !slip) return
    try {
      setUploading(true)
      setUploadMsg(null)
      const form = new FormData()
      form.append("orderId", orderInfo.orderId)
      form.append("file", slip)
      const res = await fetch(`/api/payments/upload-slip`, { method: "POST", body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "อัพโหลดไม่สำเร็จ")
      setUploadMsg("อัพโหลดสลิปสำเร็จ กำลังรอตรวจสอบ")
    } catch (e: any) {
      setUploadMsg(e?.message ?? "อัพโหลดไม่สำเร็จ")
    } finally {
      setUploading(false)
    }
  }

  // Show enrolled popup when detected
  useEffect(() => {
    if (isEnrolled) setEnrolledOpen(true)
  }, [isEnrolled])

  // ---------- Reviews helpers ----------
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  const totalReviews = reviews.length

  const openReviewDialog = () => {
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!id || !isAuthenticated || !user?.id) {
      setLoginOpen(true)
      return
    }
    if (!reviewRating || !reviewTitle.trim() || !reviewComment.trim()) return

    try {
      setPostingReview(true)
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseId: String(id),
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        }),
      })
      const json: PostReviewResponse = await res.json().catch(() => ({ success: false }))
      if (!res.ok || json.success === false) throw new Error(json?.error || "ส่งรีวิวไม่สำเร็จ")

      // Optimistic add to top
      if (json.data) {
        setReviews((prev) => [json.data!, ...prev])
      } else {
        // ถ้า API ไม่คืนรีวิวกลับมา ให้สร้าง object ชั่วคราว
        const temp: ApiReview = {
          id: `temp_${Date.now()}`,
          userId: user.id,
          courseId: String(id),
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          createdAt: new Date().toISOString(),
          user: { id: user.id, name: user.name || "คุณผู้ใช้" },
        }
        setReviews((prev) => [temp, ...prev])
      }

      setReviewDialogOpen(false)
      setReviewTitle("")
      setReviewComment("")
      setReviewRating(5)
    } catch (e) {
      // แสดง error แบบเบา ๆ ด้วยการตั้ง state (หรือจะใส่ toast ก็ได้ถ้ามี)
    } finally {
      setPostingReview(false)
    }
  }
  // -------------------------------------

  return (
    <>
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
                  {totalContents > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                        <div>ความคืบหน้า</div>
                        <div className="font-medium">{progressPercent}% {saving ? "(กำลังบันทึก...)" : ""}</div>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 transition-all" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  )}
                  {chapters.length === 0 ? (
                    <div className="text-gray-500">ยังไม่มีบทเรียน</div>
                  ) : (
                    <div id="chapters" className="space-y-3">
                      {chapters
                        .slice()
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((ch, idx) => {
                          const number = (ch.order ?? idx + 1).toString().padStart(2, "0")
                          return (
                            <div key={ch.id} className="p-4 rounded-xl border bg-white">
                              <div className="flex items-center justify-between">
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
                                  ) : isEnrolled ? (
                                    <Button variant="ghost" size="sm" className="text-[#004B7D] hover:bg-[#004B7D1A]">
                                      <Play className="h-4 w-4 mr-1" /> เริ่มเรียน
                                    </Button>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 text-gray-400">
                                      <Lock className="h-4 w-4" /> เฉพาะผู้ลงทะเบียน
                                    </div>
                                  )}
                                </div>
                              </div>

                              {Array.isArray((ch as any).contents) && (ch as any).contents.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {(ch as any).contents.slice().sort((a: any,b: any) => (a.order ?? 0) - (b.order ?? 0)).map((ct: any) => {
                                    const checked = viewedIds.includes(ct.id)
                                    const canToggle = isEnrolled
                                    return (
                                      <div key={ct.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-yellow-50/50">
                                        <div className="text-sm text-gray-800 truncate">• {ct.title}</div>
                                        <div className="flex items-center gap-3">
                                          {canToggle ? (
                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                              <input type="checkbox" checked={checked} onChange={() => toggleContentViewed(ct.id)} />
                                              <span>เรียนแล้ว</span>
                                            </label>
                                          ) : (
                                            <span className="text-xs text-gray-400">ล็อก</span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* -------- Reviews Section (ใหม่) -------- */}
            <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.25 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">รีวิวจากผู้เรียน</CardTitle>
                      <div className="mt-1 flex items-center gap-2 text-gray-700">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-semibold">{averageRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">/ 5 จาก {totalReviews} รีวิว</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setReviewsPage((p) => Math.max(1, p))}>
                        รีเฟรช
                      </Button>
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={openReviewDialog}>
                        เขียนรีวิว
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviewsError && (
                    <div className="text-red-600 mb-3">{reviewsError}</div>
                  )}

                  {reviews.length === 0 && !reviewsLoading ? (
                    <div className="text-gray-600">ยังไม่มีรีวิวสำหรับคอร์สนี้</div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rv) => (
                        <div key={rv.id} className="rounded-xl border p-4 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 truncate">
                                  {rv.user?.name || "ผู้ใช้"}
                                </div>
                                <span className="text-xs text-gray-400">• {formatThaiDate(rv.createdAt)}</span>
                              </div>
                              <div className="mt-1">
                                <StarRating value={rv.rating} readOnly />
                              </div>
                              {rv.title && (
                                <div className="mt-2 text-gray-900 font-medium">{rv.title}</div>
                              )}
                              {rv.comment && (
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap">{rv.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-2">
                        {hasMoreReviews ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={reviewsLoading}
                            onClick={() => setReviewsPage((p) => p + 1)}
                          >
                            {reviewsLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                กำลังโหลด...
                              </>
                            ) : (
                              "โหลดเพิ่มเติม"
                            )}
                          </Button>
                        ) : (
                          <div className="text-center text-sm text-gray-500">แสดงครบแล้ว</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            {/* -------- End Reviews Section -------- */}
      
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
                      {price === 0 ? (
                        <span className="text-3xl font-bold text-green-600">ฟรี</span>
                      ) : (
                        <span className="text-3xl font-bold text-yellow-600">฿{(price || 0).toLocaleString()}</span>
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
                    {price > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-sm font-medium">คูปองส่วนลด</div>
                        <div className="flex gap-2">
                          <Input placeholder="กรอกรหัสคูปอง (ถ้ามี)"
                                 value={couponCode}
                                 onChange={(e) => setCouponCode(e.target.value)} />
                          <Button variant="outline" disabled={validatingCoupon} onClick={applyCoupon}>
                            {validatingCoupon ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                กำลังตรวจสอบ...
                              </>
                            ) : (
                              "ใช้คูปอง"
                            )}
                          </Button>
                        </div>
                        {couponError && <div className="text-xs text-red-600">{couponError}</div>}
                        {discount > 0 && (
                          <div className="flex justify-between text-sm text-green-700">
                            <span>ส่วนลดคูปอง</span>
                            <span>-฿{discount.toLocaleString()} บาท</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-semibold">
                          <span>ยอดสุทธิ</span>
                          <span>฿{finalTotal.toLocaleString()} บาท</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Removed inline banner. Replaced with modal below. */}

                  <div className="space-y-3">
                    {isEnrolled ? (
                      <Link href={`/courses/${id}/learn`}>
                        <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg py-3">เข้าเรียนทันที</Button>
                      </Link>
                    ) : (
                      <Button onClick={createOrder} disabled={creating} className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg py-3">
                        {creating ? "กำลังสร้างคำสั่งซื้อ..." : "สมัครเรียนเลย"}
                      </Button>
                    )}
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

    <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

    {/* Enrolled Modal */}
    <Dialog open={enrolledOpen} onOpenChange={setEnrolledOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>คุณได้ซื้อคอร์สนี้แล้ว</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-gray-700">เริ่มเรียนต่อได้ทันทีที่หน้าเรียน</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEnrolledOpen(false)}>ปิด</Button>
            <Link href={`/courses/${id}/learn`}>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">เข้าเรียน</Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Upload Slip Modal */}
    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-gray-700">ยอดชำระ: ฿{(orderInfo?.total ?? 0).toLocaleString()}</div>
          <Input type="file" accept="image/*" onChange={(e) => setSlip(e.target.files?.[0] || null)} />
          {uploadMsg && <div className={uploadMsg.includes("สำเร็จ") ? "text-green-600" : "text-red-600"}>{uploadMsg}</div>}
          <div className="flex justify-end gap-2">
            {orderInfo && (
              <Link href={`/order-success/${orderInfo.orderId}`} className="mr-auto">
                <Button variant="outline">รายละเอียดคำสั่งซื้อ</Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => setUploadOpen(false)}>ปิด</Button>
            <Button disabled={!slip || uploading} onClick={uploadSlip} className="bg-yellow-400 hover:bg-yellow-500 text-white">
              {uploading ? "กำลังอัพโหลด..." : "อัพโหลดสลิป"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Review Form Modal */}
    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เขียนรีวิวคอร์สนี้</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-700 mb-1">ให้คะแนน</div>
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-1">หัวข้อรีวิว</div>
            <Input
              placeholder="เช่น เยี่ยมมาก! ได้ความรู้ครบถ้วน"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-1">รายละเอียด</div>
            {Textarea ? (
              <Textarea
                rows={4}
                placeholder="แชร์ประสบการณ์ของคุณเกี่ยวกับคอร์สนี้..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            ) : (
              <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="แชร์ประสบการณ์ของคุณเกี่ยวกับคอร์สนี้..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>ยกเลิก</Button>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-white"
              disabled={postingReview || !reviewTitle.trim() || !reviewComment.trim()}
              onClick={submitReview}
            >
              {postingReview ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                "ส่งรีวิว"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
