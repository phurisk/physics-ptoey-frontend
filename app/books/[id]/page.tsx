"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useCart } from "@/components/cart-provider"
import LoginModal from "@/components/login-modal"

type Ebook = {
  id: string
  title: string
  description?: string | null
  author?: string | null
  isbn?: string | null
  price: number
  discountPrice?: number | null
  coverImageUrl?: string | null
  pageCount?: number | null
  format?: string | null
  language?: string | null
  publishedAt?: string | null
  isPhysical?: boolean
  category?: { id: string; name: string } | null
  averageRating?: number | null
}

type ApiResponse<T> = { success: boolean; data: T }
type ApiListResponse<T> = { success: boolean; data: T[]; count?: number; pagination?: any; stats?: any }

type ApiReview = {
  id: string
  userId: string
  ebookId?: string
  rating: number
  title?: string
  comment?: string
  createdAt: string
  user?: { id: string; name: string; email?: string; avatarUrl?: string }
}

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

const fmtMoney = (n?: number | null) =>
  typeof n === "number" ? `฿${n.toLocaleString()}` : "-"

const getYear = (iso?: string | null) => {
  if (!iso) return "-"
  try {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? "-" : d.getFullYear()
  } catch { return "-" }
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { addItem, items: cartItems, syncing: cartSyncing } = useCart()

  const [book, setBook] = useState<Ebook | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [couponCode, setCouponCode] = useState("")
  const [creating, setCreating] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const REVIEWS_LIMIT = 5
  const [hasMoreReviews, setHasMoreReviews] = useState(true)
  const [reviewsStats, setReviewsStats] = useState<{ totalReviews?: number; averageRating?: number } | null>(null)

  const [hasPurchased, setHasPurchased] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [postingReview, setPostingReview] = useState(false)
  const [reviewRestriction, setReviewRestriction] = useState<string | null>(null)

  const [loginOpen, setLoginOpen] = useState(false)
  const inCart = useMemo(
    () => cartItems.some((item) => item.itemType === "EBOOK" && String(item.itemId) === String(id)),
    [cartItems, id]
  )

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/ebooks/${encodeURIComponent(String(id))}`, { cache: "no-store" })
        const json: ApiResponse<Ebook> = await res.json().catch(() => ({ success: false, data: null as any }))
        if (!res.ok || json?.success === false) throw new Error("โหลดข้อมูลไม่สำเร็จ")
        if (active) setBook(json.data)
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    if (id) load()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    setReviews([])
    setReviewsPage(1)
    setHasMoreReviews(true)
    setReviewsError(null)
    setReviewsStats(null)
  }, [id])

  useEffect(() => {
    let active = true
    const checkPurchase = async () => {
      if (!isAuthenticated || !user?.id || !id) {
        if (active) {
          setHasPurchased(false)
          setReviewRestriction(null)
        }
        return
      }
      try {
        const res = await fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && Array.isArray(json?.data)) {
          const found = json.data.some((order: any) => {
            const type = String(order?.orderType || "").toUpperCase()
            if (type !== "EBOOK") return false
            const orderStatus = String(order?.status || "").toUpperCase()
            const paymentStatus = String(order?.payment?.status || "").toUpperCase()
            const paid = orderStatus === "COMPLETED" || paymentStatus === "COMPLETED"
            if (!paid) return false
            const orderEbookId = order?.ebookId ?? order?.ebook?.id ?? null
            return String(orderEbookId || "") === String(id)
          })
          setHasPurchased(found)
        } else {
          setHasPurchased(false)
        }
      } catch {
        if (active) setHasPurchased(false)
      }
    }
    checkPurchase()
    return () => {
      active = false
    }
  }, [isAuthenticated, user?.id, id])

  useEffect(() => {
    if (hasPurchased) setReviewRestriction(null)
  }, [hasPurchased])

  useEffect(() => {
    let active = true
    const loadReviews = async () => {
      if (!id || !hasMoreReviews || reviewsLoading) return
      try {
        setReviewsLoading(true)
        setReviewsError(null)
        const url = `/api/reviews?ebookId=${encodeURIComponent(String(id))}&page=${reviewsPage}&limit=${REVIEWS_LIMIT}`
        const res = await fetch(url, { cache: "no-store" })
        const text = await res.text().catch(() => "")
        let json: any = {}
        try { json = text ? JSON.parse(text) : {} } catch {}

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

  const averageRating = useMemo(() => {
    if (reviewsStats?.averageRating != null) return Number(reviewsStats.averageRating)
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews, reviewsStats])

  const totalReviews = reviewsStats?.totalReviews ?? reviews.length

  const hasDiscount = !!(book && book.discountPrice != null && book.discountPrice < book.price)
  const effectivePrice = book ? (hasDiscount ? (book.discountPrice as number) : book.price) : 0

  const goCheckout = () => {
    const q = couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ""
    router.push(`/checkout/ebook/${encodeURIComponent(String(id))}${q}`)
  }

  const openReviewDialog = () => {
    if (!isAuthenticated) { setLoginOpen(true); return }
    if (!hasPurchased) {
      setReviewRestriction("ต้องซื้อหนังสือเล่มนี้ก่อนจึงจะสามารถรีวิวได้")
      return
    }
    setReviewRestriction(null)
    setReviewDialogOpen(true)
  }

  const submitReview = async () => {
    if (!id || !isAuthenticated || !user?.id) { setLoginOpen(true); return }
    if (!hasPurchased) {
      setReviewRestriction("ต้องซื้อหนังสือเล่มนี้ก่อนจึงจะสามารถรีวิวได้")
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
          ebookId: String(id),
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        }),
      })
      const json = await res.json().catch(() => ({ success: false }))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "ส่งรีวิวไม่สำเร็จ")
      const newItem: ApiReview = json?.data ?? {
        id: `temp_${Date.now()}`,
        userId: user.id,
        ebookId: String(id),
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
        user: { id: user.id, name: user.name || "คุณผู้ใช้" },
      }
      setReviews((prev) => [newItem, ...prev])
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

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-0 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <Link href="/books">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 shadow-sm hover:shadow">
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าหนังสือทั้งหมด
              </Button>
            </Link>
          </div>

          {loading && <div className="text-center text-gray-600">กำลังโหลด...</div>}
          {!loading && error && <div className="text-center text-red-600">เกิดข้อผิดพลาด: {error}</div>}
          {!loading && !error && !book && <div className="text-center text-gray-600">ไม่พบบุ๊คนี้</div>}

          {!loading && !error && book && (
            <div className="grid lg:grid-cols-3 gap-10">
              <section className="order-1 lg:order-1 lg:col-span-2 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white">
                    <Image
                      src={book.coverImageUrl || "/placeholder.svg?height=600&width=450"}
                      alt={book.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {book.category?.name && (
                        <Badge className="rounded-full bg-yellow-400 text-white px-3 py-1 h-7">
                          {book.category.name}
                        </Badge>
                      )}
                      {book.format && (
                        <Badge variant="outline" className="rounded-full h-7 px-3">
                          รูปแบบ: {book.format}
                        </Badge>
                      )}
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight text-balance">
                      {book.title}
                    </h1>

                    <div className="text-gray-700">
                      <span className="font-medium">ผู้เขียน:</span>{" "}
                      {book.author || "ไม่ระบุผู้เขียน"}
                    </div>

                    <div className="flex items-center gap-2">
                      <StarRating value={averageRating || 0} readOnly />
                      <span className="text-sm text-gray-600">
                        {averageRating?.toFixed(1) ?? "0.0"} ({totalReviews} รีวิว)
                      </span>
                    </div>

                    {book.description && (
                      <p className="text-gray-700 leading-relaxed text-pretty">
                        {book.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                      <div><span className="text-gray-500">ISBN:</span> <span className="font-medium">{book.isbn || "-"}</span></div>
                      <div><span className="text-gray-500">ปีที่ตีพิมพ์:</span> <span className="font-medium">{getYear(book.publishedAt)}</span></div>
                      <div><span className="text-gray-500">จำนวนหน้า:</span> <span className="font-medium">{book.pageCount ?? "-"}</span></div>
                      <div><span className="text-gray-500">ภาษา:</span> <span className="font-medium">{book.language || "-"}</span></div>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="order-2 lg:order-2 lg:col-span-1">
                <Card className="rounded-2xl shadow-lg ring-1 ring-black/5">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center">
                      {hasDiscount ? (
                        <div className="flex items-end justify-center gap-3">
                          <span className="text-xl text-gray-400 line-through">{fmtMoney(book.price)}</span>
                          <span className="text-3xl font-extrabold text-yellow-600 tracking-tight">{fmtMoney(book.discountPrice)}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-extrabold text-yellow-600 tracking-tight">{fmtMoney(book.price)}</span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">ราคารวมภาษีมูลค่าเพิ่ม</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="text-sm font-medium">คูปองส่วนลด</div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="กรอกรหัสคูปอง (ถ้ามี)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) { setLoginOpen(true); return }
                          setCreating(true)
                          goCheckout()
                        }}
                        disabled={creating}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-white text-lg py-3 rounded-xl shadow hover:shadow-md transition"
                      >
                        {creating ? "กำลังไปหน้าชำระเงิน..." : "ไปหน้าชำระเงิน"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        disabled={creating || addingToCart || cartSyncing || !book || inCart}
                        onClick={async () => {
                          if (!book) return
                          if (!isAuthenticated) { setLoginOpen(true); return }
                          if (inCart) return
                          try {
                            setAddingToCart(true)
                            await addItem({
                              itemType: "EBOOK",
                              itemId: book.id,
                              title: book.title,
                              unitPrice: effectivePrice,
                            })
                          } catch (error) {
                            console.error("add ebook to cart error", error)
                          } finally {
                            setAddingToCart(false)
                          }
                        }}
                      >
                        {inCart ? "อยู่ในตะกร้าแล้ว" : addingToCart || cartSyncing ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
                      </Button>
                    </div>

                    <Separator />

                  </CardContent>
                </Card>
              </aside>

              <div className="order-3 lg:order-3 lg:col-span-2">
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">รีวิวจากผู้อ่าน</CardTitle>
                      <Button variant="outline" className="rounded-xl" onClick={openReviewDialog}>
                        เขียนรีวิว
                      </Button>
                    </div>
                    {reviewRestriction && (
                      <div className="text-sm text-red-600 mt-2">
                        {reviewRestriction}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-2">
                    {reviewsError && <div className="text-red-600 text-sm mb-3">{reviewsError}</div>}
                    {reviews.length === 0 && !reviewsLoading && (
                      <div className="text-gray-500">ยังไม่มีรีวิว</div>
                    )}
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="rounded-xl border border-gray-200 p-4 bg-white/90 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <StarRating value={r.rating} readOnly size="h-4 w-4" />
                                <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString("th-TH")}</div>
                              </div>
                              {r.title && <div className="font-medium mt-1">{r.title}</div>}
                              {r.comment && <div className="text-gray-700 mt-1">{r.comment}</div>}
                              <div className="text-xs text-gray-500 mt-2">โดย {r.user?.name || "ผู้ใช้"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center mt-4">
                      {hasMoreReviews ? (
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          disabled={reviewsLoading}
                          onClick={() => setReviewsPage((p) => p + 1)}
                        >
                          {reviewsLoading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> กำลังโหลด...</>) : "โหลดเพิ่มเติม"}
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500">ไม่มีรีวิวเพิ่มเติม</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เขียนรีวิว</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">ให้คะแนน</div>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <div>
              <Input placeholder="หัวข้อรีวิว" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} />
            </div>
            <div>
              <Textarea placeholder="ความคิดเห็นของคุณ" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={submitReview} disabled={postingReview}>
                {postingReview ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> กำลังส่ง...</> : "ส่งรีวิว"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
