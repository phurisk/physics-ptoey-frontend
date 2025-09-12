"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import LoginModal from "@/components/login-modal"
import http from "@/lib/http"

type Order = {
  id: string
  orderType: "COURSE" | "EBOOK"
  status: string
  total: number
  ebook?: { id: string; title: string; author?: string | null; coverImageUrl?: string | null; fileUrl?: string | null; previewUrl?: string | null }
}

type OrdersResponse = { success: boolean; data: Order[] }

export default function MyBooksPage() {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [links, setLinks] = useState<Record<string, string>>({})
  const [linksLoading, setLinksLoading] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!user?.id) { setLoading(false); return }
      try {
        setLoading(true)
        const res = await http.get(`/api/orders`, { params: { userId: user.id } })
        const json: OrdersResponse = res.data || { success: false, data: [] }
        if ((res.status < 200 || res.status >= 300) || json.success === false) throw new Error((json as any)?.error || "โหลดรายการไม่สำเร็จ")
        if (active) setOrders(Array.isArray(json.data) ? json.data : [])
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดรายการไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    const loadLinks = async () => {
      const paid = orders.filter((o) => o.orderType === 'EBOOK' && String(o.status).toUpperCase() === 'COMPLETED')
      const missing = paid.filter((o) => !links[o.id])
      if (!missing.length) { setLinksLoading(false); return }
      try {
        setLinksLoading(true)
        const results = await Promise.all(missing.map(async (o) => {
          try {
            const res = await fetch(`/api/orders/${encodeURIComponent(o.id)}`, { cache: 'no-store' })
            const json: any = await res.json().catch(() => ({}))
            const url = json?.data?.ebook?.fileUrl || json?.data?.ebook?.previewUrl || ''
            return [o.id, url] as const
          } catch { return [o.id, ''] as const }
        }))
        if (!cancelled) {
          const next = { ...links }
          for (const [oid, url] of results) next[oid] = url
          setLinks(next)
        }
      } catch {}
      finally {
        if (!cancelled) setLinksLoading(false)
      }
    }
    if (orders.length) loadLinks()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders])

  const paidEbooks = orders.filter((o) => o.orderType === "EBOOK" && String(o.status).toUpperCase() === "COMPLETED")

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">หนังสือของฉัน</h1>
        <p className="text-gray-600">ดู eBook ที่คุณซื้อและอ่าน/ดาวน์โหลด</p>
      </div>

      {!isAuthenticated ? (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-gray-700">กรุณาเข้าสู่ระบบเพื่อดู eBook ของคุณ</div>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setLoginOpen(true)}>เข้าสู่ระบบ</Button>
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      ) : (
        <>
          {(loading || linksLoading) && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={`sk-${i}`} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-[2/3] bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-9 bg-gray-100 rounded w-28" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && error && <div className="text-red-600">{error}</div>}

          {!loading && !error && paidEbooks.length === 0 && (
            <div className="text-gray-600">ยังไม่มี eBook ที่ชำระเงินแล้ว</div>
          )}

          {!loading && !linksLoading && !error && paidEbooks.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paidEbooks.map((o) => {
                const title = o.ebook?.title || "eBook"
                const cover = o.ebook?.coverImageUrl || "/placeholder.svg"
                const inlineFile = (o.ebook as any)?.fileUrl || (o.ebook as any)?.previewUrl || null
                const fileUrl = links[o.id] || inlineFile || null
                const resolved = Object.prototype.hasOwnProperty.call(links, o.id) || !!inlineFile
                const filename = `${title}.pdf`
                return (
                  <Card key={o.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[2/3] relative bg-white">
                        <Image src={cover} alt={title} fill className="object-contain" />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="font-semibold text-gray-900 line-clamp-2">{title}</div>
                        <div className="text-sm text-gray-600">{o.ebook?.author || "ไม่ระบุผู้เขียน"}</div>
                        <div className="flex gap-2">
                          {!resolved ? (
                            <>
                              <Button disabled className="bg-gray-200 text-gray-500">กำลังโหลด…</Button>
                              <Button disabled variant="outline">กำลังโหลด…</Button>
                            </>
                          ) : fileUrl ? (
                            <>
                              <Button
                                onClick={() => {
                                  const url = `/api/proxy-view?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`
                                  window.open(url, "_blank")
                                }}
                                className="bg-yellow-400 hover:bg-yellow-500 text-white"
                              >
                                อ่าน eBook
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const url = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`
                                  window.open(url, "_blank")
                                }}
                              >
                                ดาวน์โหลด
                              </Button>
                            </>
                          ) : (
                            <Button disabled variant="outline">ไม่มีไฟล์ดาวน์โหลด</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
