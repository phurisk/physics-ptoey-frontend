"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, Minus, Plus, Trash2, ShoppingCart,CreditCardIcon } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/cart-provider"
import { useAuth } from "@/components/auth-provider"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

type ShippingAddress = {
  name: string
  phone: string
  address: string
  district: string
  province: string
  postalCode: string
}

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, loading, syncing, itemCount, increase, decrease, remove, refresh, subtotal: cartSubtotal } = useCart()
  const { isAuthenticated, user } = useAuth()
  const [couponCode, setCouponCode] = useState("")
  const [shipping, setShipping] = useState<ShippingAddress>({ name: "", phone: "", address: "", district: "", province: "", postalCode: "" })
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [physicalMap, setPhysicalMap] = useState<Record<string, boolean>>({})
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) void refresh()
  }, [isAuthenticated, refresh])

  const subtotal = useMemo(() => {
    if (cartSubtotal && !Number.isNaN(cartSubtotal)) return cartSubtotal
    return items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0)
  }, [cartSubtotal, items])
  const totalAfterDiscount = useMemo(() => Math.max(0, subtotal - couponDiscount), [subtotal, couponDiscount])
  const anyPhysical = useMemo(() => {
    return items.some((item) => {
      const type = String(item?.itemType || item?.type || "").toUpperCase()
      if (type.includes("PHYSICAL")) return true
      if (item?.isPhysical) return true
      if (item?.course?.isPhysical) return true
      const courseType = String(item?.course?.type || "").toUpperCase()
      if (courseType.includes("PHYSICAL")) return true
      const productType = String(item?.productType || "").toUpperCase()
      if (productType.includes("PHYSICAL")) return true
      if (type === "COURSE") {
        const key = `COURSE:${item?.itemId}`
        if (physicalMap[key]) return true
      }
      return false
    })
  }, [items, physicalMap])

  useEffect(() => {
    let cancelled = false
    const loadCovers = async () => {
      const courseIds = new Set<string>()
      const ebookIds = new Set<string>()

      items.forEach((item) => {
        const type = String(item.itemType).toUpperCase()
        const key = `${type}:${item.itemId}`
        if (type === "COURSE") {
          if (item.itemId && (physicalMap[key] === undefined || (!item.coverImageUrl && !coverMap[key]))) {
            courseIds.add(item.itemId)
          }
        } else if (type === "EBOOK") {
          if (item.itemId && !item.coverImageUrl && !coverMap[key]) {
            ebookIds.add(item.itemId)
          }
        }
      })

      try {
        if (courseIds.size) {
          const results = await Promise.all(
            Array.from(courseIds).map(async (courseId) => {
              try {
                const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" })
                const json = await res.json().catch(() => ({}))
                const data = json?.data || {}
                return {
                  id: courseId,
                  cover: data?.coverImageUrl || "",
                  isPhysical: Boolean(data?.isPhysical),
                }
              } catch {
                return { id: courseId, cover: "", isPhysical: false }
              }
            })
          )
          if (!cancelled) {
            setCoverMap((prev) => {
              const next = { ...prev }
              results.forEach(({ id, cover }) => {
                if (cover) next[`COURSE:${id}`] = cover
              })
              return next
            })
            setPhysicalMap((prev) => {
              const next = { ...prev }
              results.forEach(({ id, isPhysical }) => {
                if (isPhysical) next[`COURSE:${id}`] = true
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
  }, [items, coverMap, physicalMap])

  useEffect(() => {
    setCouponDiscount(0)
    setCouponError(null)
    setCouponSuccess(null)
  }, [items, subtotal])

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("กรุณากรอกรหัสคูปอง")
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
        code: couponCode.trim(),
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

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({ variant: "destructive", title: "กรุณาเข้าสู่ระบบ", description: "เข้าสู่ระบบเพื่อทำการสั่งซื้อ" })
      return
    }
    if (!itemCount) {
      toast({ variant: "destructive", title: "ไม่มีสินค้าในตะกร้า", description: "เลือกสินค้าที่ต้องการก่อนทำการสั่งซื้อ" })
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
          couponCode: couponCode || undefined,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="text-[#004B7D] w-9 h-9" />ตะกร้าสินค้า</h1>
          <p className="text-sm text-gray-500">เลือกคอร์สหรืออีบุ๊กที่คุณต้องการ ก่อนดำเนินการชำระเงิน</p>
        </div>
      </div>

      {!isAuthenticated && (
        <Card className="mb-6 border-dashed border-[#004B7D]/40 bg-[#f4fbff]">
          <CardHeader>
            <CardTitle className="text-lg">เข้าสู่ระบบเพื่อใช้งานตะกร้า</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            ระบบตะกร้าสินค้ารองรับเฉพาะสมาชิกที่เข้าสู่ระบบ หากยังไม่มีบัญชีสามารถสมัครได้ฟรี
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          กำลังโหลดตะกร้า...
        </div>
      ) : itemCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-gray-500">
            ยังไม่มีสินค้าในตะกร้า <Link className="text-[#004B7D]" href="/courses">เลือกสินค้าเลย</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                รายการสินค้า
                <span className="text-sm font-normal text-gray-500">ทั้งหมด {itemCount} รายการ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center">
                  <div className="flex flex-1 items-start gap-4">
                    <div className={`relative w-full max-w-[128px] overflow-hidden rounded-md bg-gray-100 ring-1 ring-black/5 ${String(item.itemType).toUpperCase() === "COURSE" ? "aspect-video" : "aspect-[3/4]"}`}>
                      <Image
                        src={item.coverImageUrl || coverMap[`${String(item.itemType).toUpperCase()}:${item.itemId}`] || "/placeholder.svg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm uppercase tracking-wide text-gray-400">{item.itemType}</p>
                      <h2 className="text-base font-semibold text-gray-800">{item.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">ราคา: ฿{(item.unitPrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-4 md:w-auto">
                    <div className="flex items-center rounded-full border border-gray-200 bg-white">
                      <Button
                        variant="ghost"
                        className="h-9 w-9 rounded-full"
                        disabled={syncing || (item.quantity || 1) <= 1}
                        onClick={() => void decrease(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity ?? 1}</span>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 rounded-full"
                        disabled
                        title="จำกัดจำนวนสูงสุด 1 รายการต่อบุคคล"
                        aria-label={`เพิ่มจำนวน ${item.title} สูงสุด 1 รายการต่อบุคคล`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="min-w-[90px] text-right text-base font-semibold text-gray-800">
                      ฿{(((item.unitPrice || 0) * (item.quantity || 1)) || 0).toLocaleString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-400 hover:text-red-500"
                      onClick={() => void remove({ cartItemId: item.id, itemId: item.itemId, itemType: item.itemType })}
                      disabled={syncing}
                      aria-label={`ลบ ${item.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
                    disabled={validatingCoupon || !couponCode.trim() || !items.length}
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
              {anyPhysical && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">ที่อยู่จัดส่ง</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600" htmlFor="shipping-name">
                      ชื่อ-นามสกุลผู้รับ
                    </label>
                    <Input
                      id="shipping-name"
                      placeholder="เช่น นายสมชาย ใจดี"
                      value={shipping.name}
                      onChange={(event) => setShipping({ ...shipping, name: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600" htmlFor="shipping-phone">
                      เบอร์โทรติดต่อ
                    </label>
                    <Input
                      id="shipping-phone"
                      placeholder="เช่น 0812345678"
                      value={shipping.phone}
                      onChange={(event) => setShipping({ ...shipping, phone: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600" htmlFor="shipping-address">
                      ที่อยู่จัดส่ง
                    </label>
                    <Input
                      id="shipping-address"
                      placeholder="เช่น 123/45 หมู่บ้านตัวอย่าง แขวงบางรัก เขตบางรัก"
                      value={shipping.address}
                      onChange={(event) => setShipping({ ...shipping, address: event.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600" htmlFor="shipping-district">
                        แขวง / ตำบล
                      </label>
                      <Input
                        id="shipping-district"
                        placeholder="เช่น สีลม"
                        value={shipping.district}
                        onChange={(event) => setShipping({ ...shipping, district: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600" htmlFor="shipping-province">
                        เขต / อำเภอ
                      </label>
                      <Input
                        id="shipping-province"
                        placeholder="เช่น บางรัก"
                        value={shipping.province}
                        onChange={(event) => setShipping({ ...shipping, province: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600" htmlFor="shipping-postal">
                        รหัสไปรษณีย์
                      </label>
                      <Input
                        id="shipping-postal"
                        placeholder="เช่น 10500"
                        value={shipping.postalCode}
                        onChange={(event) => setShipping({ ...shipping, postalCode: event.target.value })}
                      />
                    </div>
                  </div>
                  {shippingError && <p className="text-xs text-red-500">{shippingError}</p>}
                </div>
              )}
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
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full bg-[#004B7D] hover:bg-[#00395d]" size="lg" onClick={handleCheckout} disabled={syncing || submitting}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> กำลังดำเนินการ...
                  </span>
                ) : (
                  "ไปขั้นตอนชำระเงิน" 
                )} 
                <CreditCardIcon/>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/courses")}>เลือกสินค้าเพิ่ม</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
