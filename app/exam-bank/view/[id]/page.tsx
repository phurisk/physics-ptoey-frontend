"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LoginModal from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"
import PdfViewer from "@/components/pdf/pdf-viewer"

type ExamDetail = {
  id: string
  title: string
  description?: string | null
  category?: { id: string; name: string }
  files?: Array<{
    id: string | number
    fileName?: string
    filePath?: string
    fileType?: string
    uploadedAt?: string
    isDownload?: boolean
    url?: string
    fileUrl?: string
    downloadUrl?: string
    cloudinaryUrl?: string
    name?: string
    filename?: string
    originalName?: string
    publicId?: string
    mime?: string
    mimeType?: string
    contentType?: string
  }>
}

export default function ExamViewer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [activeFile, setActiveFile] = useState<{
    id?: string
    name: string
    url: string
    type?: string
    isDownload?: boolean
  } | null>(null)
  const { id } = use(params)
  const fileIdParam = searchParams?.get("fileId") ?? null
  const fileUrlParam = searchParams?.get("fileUrl") ?? null

  const viewLabel = useMemo(() => {
    if (!activeFile) return "ดูข้อสอบ"
    return activeFile.isDownload === false ? "ดูเฉลย" : "ดูข้อสอบ"
  }, [activeFile])

  const resolvedFile = useMemo(() => {
    if (!activeFile) {
      return { viewerSrc: null as string | null, iframeSrc: null as string | null, isPdf: false }
    }
    const filename = activeFile.name || exam?.title || "exam.pdf"
    const viewerSrc = `/api/proxy-view?url=${encodeURIComponent(activeFile.url)}&filename=${encodeURIComponent(filename)}`
    const isPdf =
      /pdf/i.test(activeFile.type || "") ||
      /\.pdf(?:\?|$)/i.test(activeFile.url) ||
      /\.pdf$/i.test(filename)
    const iframeSrc = isPdf ? `${viewerSrc}#page=1&zoom=page-width` : viewerSrc
    return { viewerSrc, iframeSrc, isPdf }
  }, [activeFile, exam?.title])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/exams/${encodeURIComponent(id)}?include=files`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json().catch(() => ({}))
        const detail: ExamDetail | null = json?.data || null
        if (!detail) throw new Error("ไม่พบข้อมูลข้อสอบ")
        if (!cancelled) setExam(detail)

        const normalizedFiles = (detail.files || [])
          .map((f) => {
            const raw: any = f
            const rawUrl =
              raw?.filePath ??
              raw?.url ??
              raw?.fileUrl ??
              raw?.downloadUrl ??
              raw?.cloudinaryUrl ??
              ""
            const url = typeof rawUrl === "string" ? rawUrl : ""
            if (!url) return null
            const idValue = raw?.id
            const id = idValue != null ? String(idValue) : undefined
            const name =
              raw?.fileName ??
              raw?.name ??
              raw?.title ??
              raw?.filename ??
              raw?.originalName ??
              raw?.publicId ??
              "ไฟล์ข้อสอบ"
            const type =
              raw?.fileType ??
              raw?.mimeType ??
              raw?.mime ??
              raw?.contentType ??
              ""
            const isDownload =
              typeof raw?.isDownload === "boolean" ? raw.isDownload : undefined
            return { id, name, url, type, isDownload }
          })
          .filter(Boolean) as {
          id?: string
          name: string
          url: string
          type?: string
          isDownload?: boolean
        }[]

        const requestedFile =
          (fileIdParam
            ? normalizedFiles.find((f) => f.id === fileIdParam)
            : undefined) ??
          (fileUrlParam
            ? normalizedFiles.find((f) => f.url === fileUrlParam)
            : undefined)

        const pdfs = normalizedFiles.filter(
          (f) => /pdf/i.test(f.type || "") || /\.pdf(\?|$)/i.test(f.url)
        )
        const prioritized = pdfs.length > 0 ? pdfs : normalizedFiles
        const fallbackFile = prioritized[0] || null

        if (!cancelled) {
          const nextFile = requestedFile ?? fallbackFile
          setActiveFile(nextFile)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, fileIdParam, fileUrlParam])


  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-white to-yellow-50 pt-20">
        <div className="container mx-auto px-4 py-6">
<div className="mb-4">
  <div className="flex items-center gap-2 w-full">
    <Button variant="outline" onClick={() => router.back()} className="cursor-pointer">
      <ArrowLeft className="h-4 w-4 mr-1" /> กลับ
    </Button>

    <Badge variant="secondary" className="bg-yellow-400 text-white hidden sm:inline-flex">
      {viewLabel}
    </Badge>

  </div>
</div>


          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {viewLabel} - {exam?.title || "กำลังโหลด..."}
            </h1>
            {!!exam?.category?.name && (
              <p className="text-gray-600 mt-1">หมวดหมู่: {exam.category.name}</p>
            )}
          </div>

          {loading && (
            <div className="text-center text-gray-500 py-10">กำลังโหลด...</div>
          )}
          {!loading && error && (
            <div className="text-center text-red-600 py-10">{error}</div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 gap-6">
              <Card className="overflow-hidden border-2 border-yellow-100">
                <CardContent className="p-0 bg-white">
                  {!activeFile ? (
                    <div className="text-center text-gray-500 py-12">ไม่พบไฟล์สำหรับข้อสอบนี้</div>
                  ) : (
                    <div className="w-full bg-gray-100">
                      {resolvedFile.isPdf && resolvedFile.viewerSrc ? (
                        <div className="h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[83vh]">
                          <PdfViewer fileUrl={resolvedFile.viewerSrc} className="rounded-b-2xl bg-white" />
                        </div>
                      ) : (
                        <iframe
                          src={resolvedFile.iframeSrc ?? activeFile.url}
                          className="w-full h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[83vh]"
                          title={activeFile.name}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
