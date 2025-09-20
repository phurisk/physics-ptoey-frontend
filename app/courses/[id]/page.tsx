"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Users, BookOpen, Clock, Play, ArrowLeft, Lock, Loader2, Star, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import LoginModal from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"

import { Textarea } from "@/components/ui/textarea"

const API_BASE = (process.env.NEXT_PUBLIC_ELEARNING_BASE_URL || "").replace(/\/$/, "");

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-gray-200 ${className}`}>
      <div className="absolute inset-0 -translate-x-full shimmer" />
    </div>
  )
}


function getYouTubeEmbedUrl(url: string) {
  const id = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null
}
function getVimeoEmbedUrl(url: string) {
  const id = url.match(/(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(\d+)/)?.[1]
  return id ? `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0` : null
}
function getEmbedSrc(url?: string | null) {
  if (!url) return null
  return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url)
}


type ApiCourse = {
  id: string
  title: string
  description: string
  price: number
  discountPrice?: number | null
  duration: string | null
  sampleVideo?: string | null
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
  const router = useRouter()
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
  const [slipPreview, setSlipPreview] = useState<string | null>(null)

  // ---------- Reviews state ----------
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const REVIEWS_LIMIT = 5
  const [hasMoreReviews, setHasMoreReviews] = useState(true)

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRestriction, setReviewRestriction] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [postingReview, setPostingReview] = useState(false)
  // -----------------------------------
  const [reviewsStats, setReviewsStats] = useState<{ totalReviews?: number; averageRating?: number } | null>(null)


  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  // Intro video source 
  const [introSrc, setIntroSrc] = useState<string | null>(null)


  useEffect(() => {
    if (chapters.length) {
      const first = chapters
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
      if (first && !activeChapterId) setActiveChapterId(first.id)
    } else {
      setActiveChapterId(null)
    }
 
  }, [chapters.length])
  // ---------------------------------------------------

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
          } catch { }
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

  // Resolve intro video from course.sampleVideo (public field)
  useEffect(() => {
    const src = getEmbedSrc(course?.sampleVideo || null)
    setIntroSrc(src)
  }, [course?.sampleVideo])

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
      } catch { }
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
      } catch { }
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
    if (isEnrolled) setReviewRestriction(null)
  }, [isEnrolled])

  useEffect(() => {
    let active = true
    const loadReviews = async () => {
      if (!id || !hasMoreReviews || reviewsLoading) return
      try {
        setReviewsLoading(true)
        setReviewsError(null)

        const url = `/api/reviews?courseId=${encodeURIComponent(String(id))}&page=${reviewsPage}&limit=${REVIEWS_LIMIT}`
        const res = await fetch(url, { cache: "no-store" })

        
        const text = await res.text().catch(() => "")
        let json: any = {}
        try { json = text ? JSON.parse(text) : {} } catch { }

        if (!res.ok || json?.success === false) {
          const msg = json?.error || (text && text.slice(0, 300)) || `HTTP ${res.status}`
          throw new Error(msg)
        }

        
        const list: ApiReview[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.data?.reviews)
            ? json.data.reviews
            : []

        const pagination = json?.data?.pagination
        const stats = json?.data?.stats

        if (active) {
          setReviews((prev) => [...prev, ...list])
          if (stats) setReviewsStats({ totalReviews: stats.totalReviews, averageRating: stats.averageRating })

          const hasMore = pagination
            ? Number(pagination.page) < Number(pagination.totalPages)
            : list.length >= REVIEWS_LIMIT
          setHasMoreReviews(hasMore)
        }
      } catch (e: any) {
        if (active) setReviewsError(e?.message ?? "โหลดรีวิวไม่สำเร็จ")
      } finally {
        if (active) setReviewsLoading(false)
      }
    }
    loadReviews()
    return () => { active = false }
  }, [id, reviewsPage])


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
    } catch { }
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

  const originalPrice = course?.price ?? 0
  const discountedPrice = course?.discountPrice ?? null
  const effectivePrice = (course?.isFree || originalPrice === 0)
    ? 0
    : (discountedPrice != null ? discountedPrice : originalPrice)
  const hasDiscount = !course?.isFree && discountedPrice != null && discountedPrice < originalPrice
  const finalTotal = Math.max(0, (effectivePrice || 0) - (discount || 0))

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
          subtotal: effectivePrice,
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
    // ส่งไปหน้า Checkout เพื่อให้กรอกที่อยู่จัดส่งและใช้คูปอง
    const couponQuery = couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ""
    router.push(`/checkout/course/${encodeURIComponent(String(id))}${couponQuery}`)
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

  // Build/cleanup preview for selected slip
  useEffect(() => {
    if (!slip) {
      if (slipPreview) {
        try { URL.revokeObjectURL(slipPreview) } catch {}
      }
      setSlipPreview(null)
      return
    }
    const url = URL.createObjectURL(slip)
    setSlipPreview(url)
    return () => {
      try { URL.revokeObjectURL(url) } catch {}
    }
  }, [slip])


  useEffect(() => {
    if (isEnrolled) setEnrolledOpen(true)
  }, [isEnrolled])

  // ---------- Reviews helpers ----------
  const averageRating = useMemo(() => {
    if (reviewsStats?.averageRating != null) return Number(reviewsStats.averageRating)
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews, reviewsStats])

  const totalReviews = reviewsStats?.totalReviews ?? reviews.length


  const openReviewDialog = () => {
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    if (!isEnrolled) {
      setReviewRestriction("ต้องซื้อคอร์สนี้ก่อนจึงจะสามารถรีวิวได้")
      return
    }
    setReviewRestriction(null)
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!id || !isAuthenticated || !user?.id) {
      setLoginOpen(true)
      return
    }
    if (!isEnrolled) {
      setReviewRestriction("ต้องซื้อคอร์สนี้ก่อนจึงจะสามารถรีวิวได้")
      setReviewDialogOpen(false)
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


      if (json.data) {
        setReviews((prev) => [json.data!, ...prev])
      } else {

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

      setReviewRestriction(null)
      setReviewDialogOpen(false)
      setReviewTitle("")
      setReviewComment("")
      setReviewRating(5)
    } catch (e) {

    } finally {
      setPostingReview(false)
    }
  }
  // -------------------------------------

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-0 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="mb-6">
            <Link href="/courses">
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-gray-200 shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าคอร์สเรียนทั้งหมด
              </Button>
            </Link>
          </div>


          {loading && (
            <div className="grid lg:grid-cols-3 gap-12 py-4" aria-busy="true" aria-live="polite">

              <section className="lg:col-span-2 space-y-8 order-1 lg:order-1">

                <div className="aspect-video rounded-2xl ring-1 ring-black/5 shadow-lg overflow-hidden">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>


                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-32 rounded-full" />
                </div>


                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>


                <div className="flex flex-wrap items-center gap-6">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>


                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-end justify-between gap-4">
                      <Skeleton className="h-6 w-40" />
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>


                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border bg-white/90 backdrop-blur border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                              <Skeleton className="h-9 w-9 rounded-full" />
                              <div className="space-y-2 w-48">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                          </div>

                          <div className="mt-3 space-y-2 border-l-2 border-yellow-100 pl-3">
                            <Skeleton className="h-4 w-56" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>


              <aside className="lg:col-span-1 order-2 lg:order-2">
                <Card className="rounded-2xl shadow-lg ring-1 ring-black/5">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      <Skeleton className="h-8 w-40 mx-auto" />
                      <Skeleton className="h-3 w-32 mx-auto mt-2" />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>

                    <Separator />

                    <div className="text-center space-y-1">
                      <Skeleton className="h-3 w-40 mx-auto" />
                      <Skeleton className="h-3 w-28 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </aside>


              <section className="lg:col-span-2 order-3 lg:order-3">
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-end justify-between gap-4">
                      <Skeleton className="h-6 w-40" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-24 rounded-xl" />
                        <Skeleton className="h-9 w-28 rounded-xl" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-gray-200 p-4 bg-white/90 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-5/6" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          )}

          {!loading && error && (
            <div className="text-center text-red-600 py-10">
              เกิดข้อผิดพลาด: {error}
            </div>
          )}
          {!loading && !error && !course && (
            <div className="text-center text-gray-600 py-10">ไม่พบคอร์สนี้</div>
          )}

          {!loading && !error && course && (
            <div className="grid lg:grid-cols-3 gap-12">

              <section className="lg:col-span-2 space-y-8 order-1 lg:order-1">
                <motion.div variants={fadeInUp} initial="initial" animate="animate">
                  <div className="group relative aspect-video overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-lg mb-6">
                    {introSrc ? (
                      <iframe
                        src={introSrc}
                        className="w-full h-full"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        title={`${course.title} - แนะนำคอร์ส`}
                      />
                    ) : (
                      <>
                        <Image
                          src={course.coverImageUrl || "/placeholder.svg?height=400&width=700"}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button
                            size="lg"
                            className="bg-yellow-400 hover:bg-yellow-500 text-white shadow-lg hover:shadow-xl rounded-xl px-6 py-6 ring-1 ring-white/20 transition-all"
                          >
                            <Play className="h-6 w-6 mr-2" />
                            ดูตัวอย่าง
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className="rounded-full bg-yellow-400 text-white px-3 py-1 h-7">
                      {course.category?.name ?? "คอร์ส"}
                    </Badge>
                    {course.instructor?.name && (
                      <Badge variant="outline" className="rounded-full h-7 px-3">
                        {course.instructor?.name}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight text-balance">
                    {course.title}
                  </h1>
                  <p className="text-lg text-gray-600 mb-6 text-pretty">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 text-gray-700">
                    <div className="inline-flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#004B7D]" />
                      <span className="font-medium">
                        {course._count?.enrollments ?? 0} นักเรียน
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#004B7D]" />
                      <span className="font-medium">
                        {course._count?.chapters ?? 0} บทเรียน
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#004B7D]" />
                      <span className="font-medium">{course.duration ?? "-"}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.2 }}
                >
                  <Card className="rounded-2xl border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
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
                    <CardContent className="pt-2">
                      {totalContents > 0 && (
                        <div className="mb-5">
                          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                            <div>ความคืบหน้า</div>
                            <div className="font-semibold">
                              {progressPercent}% {saving ? "(กำลังบันทึก...)" : ""}
                            </div>
                          </div>
                          <div
                            className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={progressPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-[width] duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
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
                              const expanded = activeChapterId === ch.id
                              return (
                                <div
                                  key={ch.id}
                                  className="p-4 rounded-xl border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-gray-200 hover:border-yellow-300/60 hover:bg-yellow-50/30 transition-colors shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                 
                                    <button
                                      type="button"
                                      onClick={() => setActiveChapterId((prev) => (prev === ch.id ? null : ch.id))}
                                      aria-expanded={expanded}
                                      aria-controls={`chapter-panel-${ch.id}`}
                                      className="flex items-center gap-4 min-w-0 group/hd cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-lg pr-2"
                                    >
                                      <div className="h-9 w-9 rounded-full bg-yellow-400 text-white flex items-center justify-center font-semibold shadow-sm ring-1 ring-black/5">
                                        {number}
                                      </div>
                                      <div className="truncate text-left">
                                        <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                                          {ch.title}
                                          {ch.isFreePreview && (
                                            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                              ตัวอย่างฟรี
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronDown
                                        className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
                                        aria-hidden="true"
                                      />
                                    </button>

                                   
                                    <div className="flex items-center gap-3 text-sm text-gray-600 shrink-0">
                                      {typeof ch.duration === "number" && (
                                        <div className="inline-flex items-center gap-1">
                                          <Clock className="h-4 w-4" /> {ch.duration} นาที
                                        </div>
                                      )}
                                      {ch.isFreePreview ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[#004B7D] hover:bg-[#004B7D1A] rounded-lg"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Play className="h-4 w-4 mr-1" /> ดูตัวอย่าง
                                        </Button>
                                      ) : isEnrolled ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[#004B7D] hover:bg-[#004B7D1A] rounded-lg"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Play className="h-4 w-4 mr-1" /> เริ่มเรียน
                                        </Button>
                                      ) : (
                                        <div className="inline-flex items-center gap-1 text-gray-400">
                                          <Lock className="h-4 w-4" /> เฉพาะผู้ลงทะเบียน
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                 
                                  <AnimatePresence initial={false}>
                                    {Array.isArray((ch as any).contents) && (ch as any).contents.length > 0 && expanded && (
                                      <motion.div
                                        id={`chapter-panel-${ch.id}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-3 space-y-1.5 border-l-2 border-yellow-200 pl-3">
                                          {(ch as any).contents
                                            .slice()
                                            .sort(
                                              (a: any, b: any) =>
                                                (a.order ?? 0) - (b.order ?? 0)
                                            )
                                            .map((ct: any) => {
                                              const checked = viewedIds.includes(ct.id)
                                              const canToggle = isEnrolled
                                              return (
                                                <div
                                                  key={ct.id}
                                                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-yellow-50/60"
                                                >
                                                  <div className="text-sm text-gray-800 truncate">
                                                    • {ct.title}
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                    {canToggle ? (
                                                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                                        <input
                                                          type="checkbox"
                                                          className="accent-yellow-500 h-4 w-4"
                                                          checked={checked}
                                                          onChange={() => toggleContentViewed(ct.id)}
                                                        />
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
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </section>


              <aside className="lg:col-span-1 order-2 lg:order-2">
                <motion.div
                  className="lg:sticky lg:top-24"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.1 }}
                >
                  <Card className="rounded-2xl shadow-lg ring-1 ring-black/5">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          {effectivePrice === 0 ? (
                            <span className="text-3xl font-extrabold text-green-600 tracking-tight">
                              ฟรี
                            </span>
                          ) : hasDiscount ? (
                            <div className="flex items-end gap-3">
                              <span className="text-xl text-gray-400 line-through">
                                ฿{(originalPrice || 0).toLocaleString()}
                              </span>
                              <span className="text-3xl font-extrabold text-yellow-600 tracking-tight">
                                ฿{(effectivePrice || 0).toLocaleString()} บาท
                              </span>
                            </div>
                          ) : (
                            <span className="text-3xl font-extrabold text-yellow-600 tracking-tight">
                              ฿{(effectivePrice || 0).toLocaleString()} บาท
                            </span>
                          )}
                        </div>
                      </div>

                      <Separator className="mb-6" />

                      <div className="space-y-3 mb-6 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ระยะเวลา</span>
                          <span className="font-medium">{course.duration ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">บทเรียน</span>
                          <span className="font-medium">
                            {course._count?.chapters ?? 0} บทเรียน
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">นักเรียน</span>
                          <span className="font-medium">
                            {course._count?.enrollments ?? 0} คน
                          </span>
                        </div>

                        {effectivePrice > 0 && (
                          <div className="space-y-2 pt-2">
                            <div className="text-sm font-medium">คูปองส่วนลด</div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="กรอกรหัสคูปอง (ถ้ามี)"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="h-10 rounded-lg"
                              />
                              <Button
                                variant="outline"
                                disabled={validatingCoupon}
                                onClick={applyCoupon}
                                className="rounded-lg"
                              >
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
                            {couponError && (
                              <div className="text-xs text-red-600">{couponError}</div>
                            )}
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

                      <div className="space-y-3">
                        {isEnrolled ? (
                          <Link href={`/profile/my-courses/course/${id}/`}>
                            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg py-3 rounded-xl shadow hover:shadow-md transition">
                              เข้าเรียนทันที
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            onClick={() => {
                              if (!isAuthenticated) { setLoginOpen(true); return }
                              const q = couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ""
                              router.push(`/checkout/course/${encodeURIComponent(String(id))}${q}`)
                            }}
                            disabled={creating}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg py-3 rounded-xl shadow hover:shadow-md transition"
                          >
                            {creating ? "กำลังสร้างคำสั่งซื้อ..." : "สมัครเรียนเลย"}
                          </Button>
                        )}
                        <Button variant="outline" className="w-full rounded-xl">
                          เพิ่มในรายการโปรด
                        </Button>
                      </div>

                      <Separator className="my-6" />

                    </CardContent>
                  </Card>
                </motion.div>
              </aside>


              <section id="reviewsSection" className="lg:col-span-2 order-3 lg:order-3">
                <motion.div
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.25 }}
                >
                  <Card className="rounded-2xl border-gray-200 shadow-sm">
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
                          <Button
                            variant="outline"
                            className="rounded-xl border-gray-200"
                            onClick={() => {
                              setReviews([]);
                              setReviewsPage(1);
                              setHasMoreReviews(true);
                              setReviewsError(null);
                              setReviewsStats(null);
                            }}
                          >
                            รีเฟรช
                          </Button>

                          <Button
                            className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl"
                            onClick={openReviewDialog}  
                          >
                            เขียนรีวิว
                          </Button>
                        </div>
                        {reviewRestriction && (
                          <div className="text-sm text-red-600 mt-2">
                            {reviewRestriction}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {reviewsError ? (
                        <div className="text-red-600 mb-3">{reviewsError}</div>
                      ) : reviews.length === 0 && !reviewsLoading ? (
                        <div className="text-gray-600">ยังไม่มีรีวิวสำหรับคอร์สนี้</div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((rv) => (
                            <div
                              key={rv.id}
                              className="rounded-xl border border-gray-200 p-4 bg-white/90 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold text-gray-900 truncate">
                                      {rv.user?.name || "ผู้ใช้"}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      • {formatThaiDate(rv.createdAt)}
                                    </span>
                                  </div>
                                  <div className="mt-1">
                                    <StarRating value={rv.rating} readOnly />
                                  </div>
                                  {rv.title && (
                                    <div className="mt-2 text-gray-900 font-medium">
                                      {rv.title}
                                    </div>
                                  )}
                                  {rv.comment && (
                                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                                      {rv.comment}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="pt-2">
                            {hasMoreReviews ? (
                              <Button
                                variant="outline"
                                className="w-full rounded-xl"
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
                              <div className="text-center text-sm text-gray-500">
                                แสดงครบแล้ว
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </section>
            </div>
          )}
        </div>
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <Dialog open={enrolledOpen} onOpenChange={setEnrolledOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>คุณได้ซื้อคอร์สนี้แล้ว</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-gray-700">เริ่มเรียนต่อได้ทันทีที่หน้าเรียน</div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setEnrolledOpen(false)}>
                ปิด
              </Button>
              <Link href={`/profile/my-courses/course/${id}/`}>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">
                  เข้าเรียน
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={() => {
                  setEnrolledOpen(false)
                  setReviewDialogOpen(true)
                }}
              >
                เขียนรีวิวคอร์สนี้
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัพโหลดหลักฐานการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              ยอดชำระ: ฿{(orderInfo?.total ?? 0).toLocaleString()}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSlip(e.target.files?.[0] || null)}
              className="h-10"
            />
            {slipPreview && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">ตัวอย่างรูปที่เลือก</div>
                <div className="relative border rounded-md overflow-hidden bg-gray-50">
                  <img src={slipPreview} alt="ตัวอย่างสลิป" className="max-h-72 w-full object-contain" />
                </div>
              </div>
            )}
            {uploadMsg && (
              <div className={uploadMsg.includes("สำเร็จ") ? "text-green-600" : "text-red-600"}>
                {uploadMsg}
              </div>
            )}
            <div className="flex justify-end gap-2">
              {orderInfo && (
                <Link href={`/order-success/${orderInfo.orderId}`} className="mr-auto">
                  <Button variant="outline">รายละเอียดคำสั่งซื้อ</Button>
                </Link>
              )}
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                ปิด
              </Button>
              <Button
                disabled={!slip || uploading}
                onClick={uploadSlip}
                className="bg-yellow-400 hover:bg-yellow-500 text-white"
              >
                {uploading ? "กำลังอัพโหลด..." : "อัพโหลดสลิป"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                className="h-10"
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
                  className="min-h-[120px]"
                />
              ) : (
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px]"
                  placeholder="แชร์ประสบการณ์ของคุณเกี่ยวกับคอร์สนี้..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                ยกเลิก
              </Button>
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

      <style jsx>{`
    .shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
      animation: shimmer 1.8s infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `}</style>
    </>


  )

}
