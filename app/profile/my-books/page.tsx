"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import LoginModal from "@/components/login-modal"
import http from "@/lib/http"

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
const normalizeUrl = (u?: string | null): string => {
  const url = String(u || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (API_BASE) return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
  return url
}

type Order = {
  id: string
  orderType: "COURSE" | "EBOOK"
  status: string
  total: number
  ebook?: { id: string; title: string; author?: string | null; coverImageUrl?: string | null; fileUrl?: string | null; previewUrl?: string | null }
  payment?: { status?: string | null }
}

type OrdersResponse = { success: boolean; data: Order[] }

export default function MyBooksPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [links, setLinks] = useState<Record<string, string>>({})
  const [linksLoading, setLinksLoading] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [ebookMeta, setEbookMeta] = useState<Record<string, { title?: string | null; coverImageUrl?: string | null; author?: string | null; fileUrl?: string | null }>>({})


  function isPaidLikeStatus(s?: string | null) {
    const x = String(s || "").toUpperCase()
    return ["COMPLETED", "PAID", "APPROVED", "SUCCESS"].includes(x)
  }

  const linkKey = (orderId: string, ebookId: string) => `${orderId}:${ebookId}`

  const fetchOrderLink = async (orderId: string, ebookId?: string) => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      const json: any = await res.json().catch(() => ({}))
      let url = ''
      const fromOrder = json?.data?.ebook
      if (fromOrder && (!ebookId || String(fromOrder?.id) === String(ebookId))) {
        url = fromOrder?.fileUrl || fromOrder?.previewUrl || ''
      }

      if (!url) {
        const items: any[] = Array.isArray(json?.data?.items) ? json.data.items : []
        if (items.length && ebookId) {
          const found = items.find((it: any) => String(it?.itemType || '').toUpperCase() === 'EBOOK' && String(it?.itemId) === String(ebookId))
          if (found && (found.fileUrl || found.previewUrl)) {
            url = found.fileUrl || found.previewUrl
          }
        }
      }

      if (!url) {
        const eid = ebookId || json?.data?.ebook?.id
        if (eid) {
          try {
            const res2 = await fetch(`/api/ebooks/${encodeURIComponent(String(eid))}`, { cache: 'no-store' })
            const json2: any = await res2.json().catch(() => ({}))
            url = normalizeUrl(json2?.data?.fileUrl || json2?.data?.previewUrl || '')
            // cache meta as well
            setEbookMeta((prev) => ({
              ...prev,
              [String(eid)]: {
                title: json2?.data?.title ?? prev[String(eid)]?.title,
                coverImageUrl: normalizeUrl(json2?.data?.coverImageUrl ?? prev[String(eid)]?.coverImageUrl),
                author: json2?.data?.author ?? prev[String(eid)]?.author,
                fileUrl: url || prev[String(eid)]?.fileUrl || null,
              },
            }))
          } catch {}
        }
      }

      const key = ebookId ? linkKey(orderId, ebookId) : orderId
      setLinks((prev) => ({ ...prev, [key]: url }))
    } catch {
      const key = ebookId ? linkKey(orderId, ebookId) : orderId
      setLinks((prev) => ({ ...prev, [key]: '' }))
    }
  }

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!user?.id) {
        if (!authLoading) setLoading(false)
        return
      }
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
  }, [user?.id, authLoading])

  // Flatten paid ebook entries from orders (supports single-ebook orders and multi-item orders)
  const paidEbookEntries = useMemo(() => {
    const entries: { orderId: string; ebookId: string; title?: string | null; coverImageUrl?: string | null; author?: string | null }[] = []
    for (const o of orders) {
      const os = String(o.status || '')
      const ps = String(o.payment?.status || '')
      if (!isPaidLikeStatus(os) && !isPaidLikeStatus(ps)) continue

      // Legacy single-ebook order
      const eb = o.ebook
      if (eb?.id) {
        entries.push({ orderId: o.id, ebookId: String(eb.id), title: eb.title, coverImageUrl: eb.coverImageUrl, author: (eb as any)?.author })
      }

      // Multi-item orders
      const items: any[] = Array.isArray((o as any)?.items) ? (o as any).items : []
      for (const it of items) {
        const t = String(it?.itemType || '').toUpperCase()
        if (t !== 'EBOOK') continue
        const eid = String(it?.itemId || '')
        if (!eid) continue
        entries.push({ orderId: o.id, ebookId: eid, title: it?.title || eb?.title, coverImageUrl: it?.coverImageUrl || eb?.coverImageUrl, author: it?.author || (eb as any)?.author })
      }
    }
    // de-duplicate same (orderId, ebookId)
    const seen = new Set<string>()
    return entries.filter((e) => {
      const k = linkKey(e.orderId, e.ebookId)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [orders])

  useEffect(() => {
    let cancelled = false
    const loadLinks = async () => {
      const missing = paidEbookEntries.filter((e) => !links[linkKey(e.orderId, e.ebookId)])
      if (!missing.length) { setLinksLoading(false); return }
      try {
        setLinksLoading(true)
        const results = await Promise.all(missing.map(async (e) => {
          try {
            let url = ''
            try {
              const res = await fetch(`/api/orders/${encodeURIComponent(e.orderId)}`, { cache: 'no-store' })
              const json: any = await res.json().catch(() => ({}))
              const fromOrder = json?.data?.ebook
              if (fromOrder && String(fromOrder?.id) === String(e.ebookId)) {
                url = normalizeUrl(fromOrder?.fileUrl || fromOrder?.previewUrl || '')
              }
              if (!url) {
                const items: any[] = Array.isArray(json?.data?.items) ? json.data.items : []
                const found = items.find((it: any) => String(it?.itemType || '').toUpperCase() === 'EBOOK' && String(it?.itemId) === String(e.ebookId))
                if (found) url = normalizeUrl(found?.fileUrl || found?.previewUrl || '')
              }
              if (!url) {
                const res2 = await fetch(`/api/ebooks/${encodeURIComponent(String(e.ebookId))}`, { cache: 'no-store' })
                const json2: any = await res2.json().catch(() => ({}))
                url = normalizeUrl(json2?.data?.fileUrl || json2?.data?.previewUrl || '')
                // cache meta as well
                setEbookMeta((prev) => ({
                  ...prev,
                  [String(e.ebookId)]: {
                    title: json2?.data?.title ?? prev[String(e.ebookId)]?.title,
                    coverImageUrl: normalizeUrl(json2?.data?.coverImageUrl ?? prev[String(e.ebookId)]?.coverImageUrl),
                    author: json2?.data?.author ?? prev[String(e.ebookId)]?.author,
                    fileUrl: url || prev[String(e.ebookId)]?.fileUrl || null,
                  },
                }))
              }
            } catch {}
            return [linkKey(e.orderId, e.ebookId), url] as const
          } catch { return [linkKey(e.orderId, e.ebookId), ''] as const }
        }))
        if (!cancelled) {
          const next = { ...links }
          for (const [k, url] of results) next[k] = url
          setLinks(next)
        }
      } catch {}
      finally {
        if (!cancelled) setLinksLoading(false)
      }
    }
    if (paidEbookEntries.length) loadLinks()
    return () => { cancelled = true }
  }, [paidEbookEntries])

  // Fetch missing ebook metadata to display proper cover/title/author
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const missingIds = paidEbookEntries
        .map((e) => e.ebookId)
        .filter((id) => !ebookMeta[String(id)])
      if (!missingIds.length) return
      try {
        await Promise.all(missingIds.map(async (eid) => {
          try {
            const res = await fetch(`/api/ebooks/${encodeURIComponent(String(eid))}`, { cache: 'no-store' })
            const json: any = await res.json().catch(() => ({}))
            if (cancelled) return
            setEbookMeta((prev) => ({
              ...prev,
              [String(eid)]: {
                title: json?.data?.title ?? prev[String(eid)]?.title,
                coverImageUrl: normalizeUrl(json?.data?.coverImageUrl ?? prev[String(eid)]?.coverImageUrl),
                author: json?.data?.author ?? prev[String(eid)]?.author,
                fileUrl: normalizeUrl(json?.data?.fileUrl || json?.data?.previewUrl || prev[String(eid)]?.fileUrl || null),
              },
            }))
          } catch {}
        }))
      } catch {}
    }
    if (paidEbookEntries.length) run()
    return () => { cancelled = true }
  }, [paidEbookEntries, ebookMeta])

  const paidEbooks = paidEbookEntries

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">หนังสือของฉัน</h1>
        <p className="text-gray-600">ดู eBook ที่คุณซื้อและอ่าน/ดาวน์โหลด</p>
      </div>

      {authLoading && !isAuthenticated ? (
        <div className="bg-white border rounded-lg p-6 flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
          <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
        </div>
      ) : !isAuthenticated ? (
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

          {!loading && !error && paidEbooks.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paidEbooks.map((e) => {
                const meta = ebookMeta[String(e.ebookId)] || {}
                const title = meta.title || e.title || "eBook"
                const cover = meta.coverImageUrl || normalizeUrl(e.coverImageUrl) || "/placeholder.svg"
                const k = linkKey(e.orderId, e.ebookId)
                const fileUrl = links[k] || meta.fileUrl || null
                const hasKey = Object.prototype.hasOwnProperty.call(links, k)
                const resolved = hasKey || !!meta.fileUrl
                const isResolving = linksLoading && !resolved
                const filename = `${title}.pdf`
                return (
                  <Card key={k} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[2/3] relative bg-white">
                        <Image src={cover} alt={title} fill className="object-contain" />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="font-semibold text-gray-900 line-clamp-2">{title}</div>
                        <div className="text-sm text-gray-600">{meta.author || e.author || "ไม่ระบุผู้เขียน"}</div>
                        <div className="flex gap-2">
                          {isResolving ? (
                            <>
                              <Button disabled className="bg-gray-200 text-gray-500">กำลังโหลด…</Button>
                              <Button disabled variant="outline">กำลังโหลด…</Button>
                            </>
                          ) : resolved && fileUrl ? (
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
                                  const url = `/api/proxy-download-pdf?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`
                                  window.open(url, "_blank")
                                }}
                              >
                                ดาวน์โหลด
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => fetchOrderLink(e.orderId, e.ebookId)}
                              >
                                ลองดึงลิงก์อีกครั้ง
                              </Button>
                              <Button disabled className="hidden sm:inline-flex">ไม่มีไฟล์ดาวน์โหลด</Button>
                            </>
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
