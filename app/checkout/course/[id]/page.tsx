"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

type ApiCourse = {
  id: string
  title: string
  description?: string | null
  price: number
  discountPrice?: number | null
  isFree?: boolean
  isPhysical?: boolean
  coverImageUrl?: string | null
}

type ApiResponse = { success: boolean; data?: ApiCourse | null; error?: string }

export default function CheckoutCoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const search = useSearchParams()
  const { isAuthenticated, user, loading: authLoading } = useAuth()

  const couponFromQuery = (search.get("coupon") || "").trim()
  const authUserId = (user as any)?.id ?? null

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [couponCode, setCouponCode] = useState<string>("")
  const [discount, setDiscount] = useState<number>(0)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const lastAutoAppliedCoupon = useRef<string | null>(null)
  type ShippingAddress = { name: string; phone: string; address: string; district: string; province: string; postalCode: string }
  const [shipping, setShipping] = useState<ShippingAddress>({ name: "", phone: "", address: "", district: "", province: "", postalCode: "" })
  const [shippingError, setShippingError] = useState<string | null>(null)

  useEffect(() => {
    if (!couponFromQuery) {
      lastAutoAppliedCoupon.current = null
      return
    }
    setCouponCode(couponFromQuery)
    setDiscount(0)
    setCouponError(null)
    lastAutoAppliedCoupon.current = null
  }, [couponFromQuery])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const res = await fetch(`/api/courses/${encodeURIComponent(id)}`, { cache: "no-store" })
        const json: ApiResponse = await res.json().catch(() => ({ success: false }))
        if (!res.ok || json.success === false) throw new Error(json?.error || `HTTP ${res.status}`)
        if (active) setCourse(json.data || null)
      } catch (e: any) {
        if (active) setError(e?.message || "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])


  const [checkingExisting, setCheckingExisting] = useState(true)
  useEffect(() => {
    let abort = false
    ;(async () => {
      try {
        if (authLoading) { setCheckingExisting(true); return }
        if (!isAuthenticated || !id) { setCheckingExisting(false); return }
        setCheckingExisting(true)
        const uid = (user as any)?.id
        if (!uid) { setCheckingExisting(false); return }
        const res0 = await fetch(`/api/orders?userId=${encodeURIComponent(uid)}`, { cache: "no-store" })
        const text0 = await res0.text().catch(() => "")
        let json0: any = null
        try { json0 = text0 ? JSON.parse(text0) : null } catch {}
        const list: any[] = Array.isArray(json0?.data) ? json0.data : (Array.isArray(json0) ? json0 : [])
        const exists = list.find((o: any) => {
          const t = String(o?.orderType || o?.type || "").toUpperCase()
          const status = String(o?.status || "").toUpperCase()
          const courseId = o?.course?.id || o?.courseId || (t === "COURSE" ? (o?.itemId || o?.itemID) : undefined)
          const cancelledLike = ["CANCELLED", "REJECTED"].includes(status)
          return t === "COURSE" && courseId && String(courseId) === String(id) && !cancelledLike
        })
        if (!abort && exists?.id) {
          router.replace(`/order-success/${encodeURIComponent(String(exists.id))}`)
          return
        }
      } catch {}
      finally {
        if (!abort) setCheckingExisting(false)
      }
    })()
    return () => { abort = true }
  }, [id, isAuthenticated, authLoading, user, router])


  const price = useMemo(() => {
    if (!course) return 0
    if (course.isFree || (course.price ?? 0) === 0) return 0
    const original = Number(course.price || 0)
    const d = course.discountPrice as number | null | undefined
    if (d != null && d < original) return Number(d)
    return original
  }, [course])

  const finalTotal = Math.max(0, (price || 0) - (discount || 0))

  const validateCoupon = useCallback(
    async (code: string) => {
      if (!course) return
      if (!code) {
        setCouponError("กรอกรหัสคูปอง")
        setDiscount(0)
        return
      }
      try {
        setValidatingCoupon(true)
        setCouponError(null)
        const res = await fetch(`/api/coupons/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            userId: authUserId ?? "guest",
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
    },
    [course, price, authUserId]
  )

  const applyCoupon = async () => {
    await validateCoupon(couponCode)
  }

  useEffect(() => {
    if (!couponFromQuery) return
    if (!course) return
    if (!couponCode) return
    if (price <= 0) return
    if (lastAutoAppliedCoupon.current === couponFromQuery) return
    lastAutoAppliedCoupon.current = couponFromQuery
    void validateCoupon(couponFromQuery)
  }, [couponFromQuery, course, couponCode, price, validateCoupon])

  const confirmOrder = async () => {
    if (!course) return
    if (!isAuthenticated) { router.push(`/courses/${encodeURIComponent(String(id))}`); return }
    setShippingError(null)
    try {
      if (course.isPhysical) {
        const s = shipping
        const missing = [
          !s.name && "ชื่อผู้รับ",
          !s.phone && "เบอร์โทร",
          !s.address && "ที่อยู่",
          !s.district && "อำเภอ/เขต",
          !s.province && "จังหวัด",
          !s.postalCode && "รหัสไปรษณีย์",
        ].filter(Boolean) as string[]
        if (missing.length > 0) {
          setShippingError(`กรุณากรอก: ${missing.join(", ")}`)
          return
        }
        const phoneDigits = s.phone.replace(/\D/g, "")
        if (phoneDigits.length !== 10) {
          setShippingError("กรุณากรอกเบอร์โทรให้เป็นตัวเลข 10 หลัก")
          return
        }
        const postalDigits = s.postalCode.replace(/\D/g, "")
        if (postalDigits.length !== 5) {
          setShippingError("กรุณากรอกรหัสไปรษณีย์เป็นตัวเลข 5 หลัก")
          return
        }
      }

      setCreating(true)

      const userId = (user as any)?.id
      if (userId) {
        try {
          const res0 = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
          const text0 = await res0.text().catch(() => "")
          let json0: any = null
          try { json0 = text0 ? JSON.parse(text0) : null } catch {}
          const list: any[] = Array.isArray(json0?.data) ? json0.data : (Array.isArray(json0) ? json0 : [])
          const exists = list.find((o: any) => {
            const t = String(o?.orderType || o?.type || "").toUpperCase()
            const status = String(o?.status || "").toUpperCase()
            const courseId = o?.course?.id || o?.courseId || (t === "COURSE" ? (o?.itemId || o?.itemID) : undefined)
            const cancelled = ["CANCELLED", "REJECTED"].includes(status)
            return t === "COURSE" && courseId && String(courseId) === String(course.id) && !cancelled
          })
          if (exists) {
            router.push(`/order-success/${encodeURIComponent(String(exists.id))}`)
            return
          }
        } catch {}
      }

      const res = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (user as any)?.id,
          items: [
            {
              itemType: "COURSE",
              itemId: course.id,
              title: course.title,
              quantity: 1,
              unitPrice: price,
            },
          ],
          couponCode: couponCode || undefined,
          shippingAddress: course.isPhysical ? shipping : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "สร้างคำสั่งซื้อไม่สำเร็จ")
      const oid = String(json?.data?.orderId || json?.data?.id)
      router.push(`/order-success/${encodeURIComponent(oid)}`)
    } catch (e: any) {
      setCouponError(e?.message || "สร้างคำสั่งซื้อไม่สำเร็จ")
    } finally {
      setCreating(false)
    }
  }

  if (checkingExisting) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ยืนยันการสั่งซื้อคอร์ส</h1>

      {loading && <div className="text-gray-600">กำลังโหลด...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && course && !checkingExisting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{course.title}</span>
              {price === 0 && <Badge className="bg-green-600 text-white">ฟรี</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {price > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="รหัสคูปอง" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                  <Button onClick={applyCoupon} disabled={validatingCoupon}>
                    {validatingCoupon ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />ตรวจสอบ...</>) : "ใช้คูปอง"}
                  </Button>
                </div>
                {couponError && <div className="text-xs text-red-600">{couponError}</div>}
                {discount > 0 && <div className="text-xs text-green-600">ส่วนลด ฿{discount.toLocaleString()}</div>}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">ยอดชำระ</div>
                  <div className="text-lg font-semibold">฿{finalTotal.toLocaleString()}</div>
                </div>
              </div>
            )}
            {course?.isPhysical && (
              <div className="space-y-2">
                <div className="text-sm font-medium">ที่อยู่จัดส่ง</div>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input placeholder="ชื่อผู้รับ" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
                  <Input placeholder="เบอร์โทร" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                </div>
                <Input placeholder="ที่อยู่" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
                <div className="grid md:grid-cols-3 gap-2">
                  <Input placeholder="อำเภอ/เขต" value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} />
                  <Input placeholder="จังหวัด" value={shipping.province} onChange={(e) => setShipping({ ...shipping, province: e.target.value })} />
                  <Input placeholder="รหัสไปรษณีย์" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
                </div>
                {shippingError && <div className="text-xs text-red-600">{shippingError}</div>}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>ยกเลิก</Button>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={confirmOrder} disabled={creating}>
                {creating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังสร้างคำสั่งซื้อ...
                  </span>
                ) : (
                  "ยืนยันการสั่งซื้อ"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3 text-gray-800">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
              <span>กำลังดำเนินการคำสั่งซื้อของคุณ...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
