"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden"
import http from "@/lib/http"

type PromotionPost = {
  id?: string
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  imageUrlMobileMode?: string | null  
  linkUrl?: string | null
}

function todayLocalISO() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}

const STORAGE_KEY = "promo_hidden_until"

export default function PopupPromotion() {
  const [open, setOpen] = useState(false)
  const [dontShowToday, setDontShowToday] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PromotionPost | null>(null)
  const [imgSrc, setImgSrc] = useState<string>("/promotion.jpeg")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches)
    onChange(mq)
    mq.addEventListener?.("change", onChange as any)
    return () => mq.removeEventListener?.("change", onChange as any)
  }, [])

  useEffect(() => {
    const hiddenDate = localStorage.getItem(STORAGE_KEY)
    if (hiddenDate === todayLocalISO()) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {

        const params = new URLSearchParams({ postType: "promotion", featured: "true", limit: "1" })
        const res = await http.get(`/api/posts?${params.toString()}`)
        if (res.status >= 200 && res.status < 300) {
          const json = res.data || {}
          const list: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
          const promo: PromotionPost | null = list.length ? list[0] : null
          if (!cancelled) {
            setData(promo)
            setOpen(true)
          }
        } else {
          if (!cancelled) {
            setOpen(true)
          }
        }
      } catch {
        if (!cancelled) {
          setOpen(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!data) return
    const preferred =
      (isMobile ? (data.imageUrlMobileMode || data.imageUrl) : (data.imageUrl || data.imageUrlMobileMode))
      || "/promotion.jpeg"
    setImgSrc(preferred)
  }, [data, isMobile])

  const onClose = (nextOpen: boolean) => {
    if (!nextOpen && dontShowToday) {
      localStorage.setItem(STORAGE_KEY, todayLocalISO())
    }
    setOpen(nextOpen)
  }

  if (loading) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>{data?.title || "โปรโมชั่น"}</DialogTitle>
        </VisuallyHidden>

        <div className="relative w-full">
          <div className="aspect-square relative">
            <Image
              src={imgSrc}
              alt={data?.title || "Promotion"}
              fill
              className="object-cover"
              onError={() => setImgSrc("/promotion.jpeg")}
              priority
              sizes="(max-width: 640px) 100vw, 400px"
            />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {data?.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-yellow-500"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
              />
              ไม่แสดงวันนี้
            </label>

            <div className="ml-auto flex items-center gap-2">
              {data?.linkUrl && (
                <a href={data.linkUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-white">
                    ดูรายละเอียด
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
