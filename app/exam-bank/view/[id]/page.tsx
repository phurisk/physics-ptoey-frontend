"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, ArrowLeft } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import LoginModal from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"

type ExamDetail = {
  id: string
  title: string
  description?: string | null
  category?: { id: string; name: string }
  files?: Array<{ id: string; fileName?: string; filePath?: string; fileType?: string; uploadedAt?: string }>
}

export default function ExamViewer({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [activeFile, setActiveFile] = useState<{ id?: string; name: string; url: string } | null>(null)
  const { id } = use(params)

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

        const files = (detail.files || []).map((f) => ({
          id: f.id,
          name: f.fileName || "ไฟล์ข้อสอบ",
          url: f.filePath || "",
          type: f.fileType || "",
        })).filter((f) => !!f.url)
        const pdfs = files.filter((f) => /pdf/i.test(f.type) || /\.pdf(\?|$)/i.test(f.url))
        const first = (pdfs[0] || files[0]) || null
        if (!cancelled) setActiveFile(first ? { id: first.id, name: first.name, url: first.url } : null)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const handleDownload = () => {
    if (!activeFile) return
    const url = `/api/proxy-download?url=${encodeURIComponent(activeFile.url)}&filename=${encodeURIComponent(activeFile.name || exam?.title || "exam.pdf")}`
    try { window.open(url, "_blank", "noopener,noreferrer") } catch {}
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-white to-yellow-50 pt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" onClick={() => router.back()} className="cursor-pointer"><ArrowLeft className="h-4 w-4 mr-1" /> กลับ</Button>
            <Badge variant="secondary" className="bg-yellow-400 text-white">ดูข้อสอบ</Badge>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{exam?.title || "กำลังโหลด..."}</h1>
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
                      {(() => {
                        const rawPdfUrl = `/api/proxy-view?url=${encodeURIComponent(activeFile.url)}&filename=${encodeURIComponent(activeFile.name || (exam?.title || 'exam.pdf'))}`
                        const pdfWithZoom = `${rawPdfUrl}#page=1&zoom=page-width`
                        return (
                          <iframe
                            src={pdfWithZoom}
                            className="w-full h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[83vh]"
                            title={activeFile.name}
                          />
                        )
                      })()}
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
