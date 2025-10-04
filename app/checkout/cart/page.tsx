"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Loader2, ShoppingCart, CreditCardIcon } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/cart-provider"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"

type ShippingAddress = {
  name: string
  phone: string
  address: string
  district: string
  province: string
  postalCode: string
}

export default function CartCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const { items, loading, itemCount, subtotal: cartSubtotal, refresh, syncing } = useCart()

  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [shipping, setShipping] = useState<ShippingAddress>({
    name: "",
    phone: "",
    address: "",
    district: "",
    province: "",
    postalCode: "",
  })
  const [shippingError, setShippingError] = useState<string | null>(null)

  const couponFromQuery = (searchParams?.get("coupon") || "").trim()
  const [couponCode, setCouponCode] = useState<string>(couponFromQuery)
  const [couponDiscount, setCouponDiscount] = useState<number>(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const autoAppliedCoupon = useRef<string | null>(null)

  useEffect(() => {
    if (couponFromQuery && couponFromQuery !== couponCode) {
      setCouponCode(couponFromQuery)
    }
  }, [couponFromQuery, couponCode])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/cart")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      void refresh()
    }
  }, [isAuthenticated, refresh])

  const subtotal = useMemo(() => {
    if (cartSubtotal && !Number.isNaN(cartSubtotal)) return cartSubtotal
    return items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0)
  }, [cartSubtotal, items])

  const anyPhysical = useMemo(
    () =>
      items.some(
        (item) =>
          item.itemType.toUpperCase().includes("PHYSICAL") ||
          Boolean((item as any)?.isPhysical)
      ),
    [items]
  )

  const totalAfterDiscount = useMemo(() => Math.max(0, subtotal - couponDiscount), [subtotal, couponDiscount])

  useEffect(() => {
    let cancelled = false
    const loadCovers = async () => {
      const courseIds = new Set<string>()
      const ebookIds = new Set<string>()

      items.forEach((item) => {
        if (item.coverImageUrl) return
        const key = `${item.itemType}:${item.itemId}`
        if (coverMap[key]) return
        if (String(item.itemType).toUpperCase() === "COURSE") {
          if (item.itemId) courseIds.add(item.itemId)
        } else if (String(item.itemType).toUpperCase() === "EBOOK") {
          if (item.itemId) ebookIds.add(item.itemId)
        }
      })

      try {
        if (courseIds.size) {
          const results = await Promise.all(
            Array.from(courseIds).map(async (courseId) => {
              try {
                const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" })
                const json = await res.json().catch(() => ({}))
                return [courseId, json?.data?.coverImageUrl || ""] as const
              } catch {
                return [courseId, ""] as const
              }
            })
          )
          if (!cancelled) {
            setCoverMap((prev) => {
              const next = { ...prev }
              results.forEach(([id, cover]) => {
                if (cover) next[`COURSE:${id}`] = cover
              })
              return next
            })
          }
        }

        if (ebookIds.size) {
          const results = await Promise.all(
            Array.from(ebookIds).map(async (ebookId) => {
              try {
                const res = await fetch(`/api/ebooks/${encodeURIComponent(ebookId)}`, { cache: "no-store" })
                const json = await res.json().catch(() => ({}))
                return [ebookId, json?.data?.coverImageUrl || ""] as const
              } catch {
                return [ebookId, ""] as const
              }
            })
          )
          if (!cancelled) {
            setCoverMap((prev) => {
              const next = { ...prev }
              results.forEach(([id, cover]) => {
                if (cover) next[`EBOOK:${id}`] = cover
              })
              return next
            })
          }
        }
      } catch {}
    }

    if (items.length) void loadCovers()
    return () => {
      cancelled = true
    }
  }, [items, coverMap])

  useEffect(() => {
    setCouponDiscount(0)
    setCouponError(null)
    setCouponSuccess(null)
  }, [items, subtotal])

  const validateCoupon = async (code: string) => {
    if (!code) {
      setCouponError("กรุณากรอกโค้ดคูปอง")
      setCouponDiscount(0)
      setCouponSuccess(null)
      return
    }
    if (!items.length) {
      setCouponError("ไม่มีสินค้าในตะกร้า")
      setCouponDiscount(0)
      setCouponSuccess(null)
      return
    }
    try {
      setValidatingCoupon(true)
      setCouponError(null)
      setCouponSuccess(null)
      const payload = {
        code: code.trim(),
        userId: (user as any)?.id ?? "guest",
        subtotal,
        items: items.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }
      const res = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || "ใช้คูปองไม่สำเร็จ")
      const discountValue = Number(json?.data?.discount || 0)
      setCouponDiscount(discountValue)
      setCouponSuccess(discountValue > 0 ? "ใช้คูปองสำเร็จ" : "ไม่มีส่วนลดสำหรับคูปองนี้")
    } catch (error: any) {
      setCouponDiscount(0)
      setCouponError(error?.message || "ใช้คูปองไม่สำเร็จ")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleValidateCoupon = async () => {
    await validateCoupon(couponCode.trim())
  }

  useEffect(() => {
    if (!couponCode) return
    if (!items.length) return
    if (autoAppliedCoupon.current === couponCode) return
    autoAppliedCoupon.current = couponCode
    void validateCoupon(couponCode.trim())
  }, [couponCode, items])

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({ variant: "destructive", title: "กรุณาเข้าสู่ระบบ", description: "เข้าสู่ระบบเพื่อทำการสั่งซื้อ" })
      router.replace("/cart")
      return
    }

    if (!itemCount) {
      toast({ variant: "destructive", title: "ไม่มีสินค้า", description: "เพิ่มสินค้าในตะกร้าเพื่อทำการสั่งซื้อ" })
      router.replace("/cart")
      return
    }

    if (anyPhysical) {
      const required: Array<keyof ShippingAddress> = ["name", "phone", "address", "district", "province", "postalCode"]
      const missing = required.filter((field) => !shipping[field]?.trim())
      if (missing.length > 0) {
        setShippingError("กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน")
        return
      }
      const phoneDigits = shipping.phone.replace(/\D/g, "")
      if (phoneDigits.length !== 10) {
        setShippingError("กรุณากรอกเบอร์โทร 10 หลัก")
        return
      }
      const postalDigits = shipping.postalCode.replace(/\D/g, "")
      if (postalDigits.length !== 5) {
        setShippingError("กรุณากรอกรหัสไปรษณีย์ 5 หลัก")
        return
      }
      setShippingError(null)
    }

    try {
      setSubmitting(true)
      const res = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (user as any)?.id,
          items: items.map((item) => ({
            itemType: item.itemType,
            itemId: item.itemId,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          couponCode: couponCode ? couponCode.trim() : undefined,
          shippingAddress: anyPhysical ? shipping : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || "ไม่สามารถสร้างคำสั่งซื้อได้")
      }
      toast({ title: "สร้างคำสั่งซื้อสำเร็จ", description: "โปรดอัพโหลดสลิปชำระเงินหากมี" })
      void refresh()
      const orderId = String(json?.data?.orderId ?? json?.data?.id ?? "")
      if (orderId) {
        router.push(`/order-success/${encodeURIComponent(orderId)}`)
      } else {
        router.push("/profile/orders")
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "ไม่สำเร็จ", description: error?.message || "ไม่สามารถสร้างคำสั่งซื้อได้" })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!loading && !itemCount) {
      router.replace("/cart")
    }
  }, [loading, itemCount, router])

  const loadingState = loading || authLoading

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingCart className="h-8 w-8 text-[#004B7D]" />ยืนยันคำสั่งซื้อ</h1>
          <p className="text-sm text-gray-500">ตรวจสอบรายละเอียดก่อนดำเนินการชำระเงิน</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/cart")}>ย้อนกลับไปยังตะกร้า</Button>
      </div>

      {loadingState ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-20 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            กำลังโหลดข้อมูลตะกร้า...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการสินค้า ({itemCount})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item) => {
                const key = `${String(item.itemType).toUpperCase()}:${item.itemId}`
                const cover = item.coverImageUrl || coverMap[key] || "/placeholder.svg"
                return (
                  <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center">
                    <div className={`relative w-full max-w-[128px] overflow-hidden rounded-md bg-gray-100 ring-1 ring-black/5 ${String(item.itemType).toUpperCase() === "COURSE" ? "aspect-video" : "aspect-[3/4]"}`}>
                      <Image src={cover} alt={item.title} fill className="object-cover" sizes="128px" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm uppercase tracking-wide text-gray-400">{item.itemType}</p>
                      <h2 className="text-base font-semibold text-gray-800">{item.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">จำนวน {item.quantity} × ฿{(item.unitPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right text-base font-semibold text-gray-800">
                      ฿{(((item.unitPrice || 0) * (item.quantity || 1)) || 0).toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">สรุปคำสั่งซื้อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="coupon">
                  โค้ดส่วนลด
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="coupon"
                    placeholder="กรอกรหัสคูปอง"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value)
                      setCouponError(null)
                      setCouponSuccess(null)
                    }}
                    disabled={validatingCoupon || submitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap sm:w-auto"
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || submitting || !couponCode.trim() || !items.length}
                  >
                    {validatingCoupon ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> ตรวจสอบ...
                      </span>
                    ) : (
                      "ตรวจสอบคูปอง"
                    )}
                  </Button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                {couponSuccess && !couponError && <p className="text-xs text-green-600">{couponSuccess}</p>}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>ยอดรวม</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>ส่วนลดคูปอง</span>
                  <span>-฿{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>ค่าจัดส่ง</span>
                <span>฿0</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                <span>ยอดชำระทั้งหมด</span>
                <span>฿{totalAfterDiscount.toLocaleString()}</span>
              </div>
            </CardContent>
            {anyPhysical && (
              <>
                <Separator className="mx-6" />
                <CardContent className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">ที่อยู่จัดส่ง</h3>
                  <Input placeholder="ชื่อผู้รับ" value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} />
                  <Input placeholder="เบอร์โทร" value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} />
                  <Input placeholder="ที่อยู่" value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input placeholder="แขวง / ตำบล" value={shipping.district} onChange={(event) => setShipping({ ...shipping, district: event.target.value })} />
                    <Input placeholder="เขต / จังหวัด" value={shipping.province} onChange={(event) => setShipping({ ...shipping, province: event.target.value })} />
                    <Input placeholder="รหัสไปรษณีย์" value={shipping.postalCode} onChange={(event) => setShipping({ ...shipping, postalCode: event.target.value })} />
                  </div>
                  {shippingError && <p className="text-xs text-red-500">{shippingError}</p>}
                </CardContent>
              </>
            )}
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full bg-[#004B7D] hover:bg-[#00395d]" size="lg" onClick={handleSubmit} disabled={syncing || submitting}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> กำลังดำเนินการ...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ดำเนินการชำระเงิน
                    <CreditCardIcon className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/courses")}>เลือกสินค้าเพิ่ม</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
