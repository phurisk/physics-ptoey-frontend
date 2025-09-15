"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, FileText, Search, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import http from "@/lib/http"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"
import Link from "next/link"
import { useRouter } from "next/navigation"
import LoginModal from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"

type ApiExam = {
  id: string
  title: string
  description: string | null
  categoryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string }
  _count?: { files: number }
}

type ApiResponse = {
  success: boolean
  data: ApiExam[]
}

type UiExam = {
  id: string
  title: string
  categoryName: string
  year: number
  examType: string
  subject?: string
  pdfUrl?: string
  downloadUrl?: string
}

const EXAMS_API = "/api/exams"

export default function ExamBankPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExam, setSelectedExam] = useState<UiExam | null>(null)

  const [data, setData] = useState<ApiExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState<string | null>(null)
  const [files, setFiles] = useState<{ id?: string; name?: string; url: string; mime?: string }[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(EXAMS_API, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ApiResponse = await res.json()
        if (active) setData(json.data || [])
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load exams")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await http.get(`/api/exam-categories`)
        const json: any = res.data || {}
        const list: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        const palette = [
          "rgb(250 202 21)",
          "rgb(254 190 1)",
          "rgb(0 75 125)",
          "rgb(255 90 31)",
          "rgb(155 28 28)",
          "rgb(30 64 175)",
          "rgb(16 185 129)",
        ]
        const mapped = list
          .filter((c) => c?.isActive !== false)
          .map((c: any, idx: number) => ({
            id: String(c?.id ?? c?.slug ?? c?.name ?? idx),
            name: c?.name ?? String(c?.slug ?? `ประเภท ${idx + 1}`),
            color: palette[idx % palette.length],
          }))
        const withAll = [{ id: "all", name: "ทั้งหมด", color: "rgb(250 202 21)" }, ...mapped]
        if (!cancelled) setCategories(withAll)
      } catch {
        if (!cancelled) setCategories([{ id: "all", name: "ทั้งหมด", color: "rgb(250 202 21)" }])
      }
    })()
    return () => { cancelled = true }
  }, [])

  // โหลดไฟล์เมื่อเปิด Dialog
  useEffect(() => {
    let cancelled = false
    async function loadFiles(examId: string) {
      try {
        setFilesLoading(true)
        setFilesError(null)
        setFiles([])

        const res = await fetch(`${EXAMS_API}/${encodeURIComponent(examId)}?include=files`, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json().catch(() => ({}))
        const detail = json?.data || json

        const rawFiles = (detail?.files || detail?.data?.files || []) as any[]
        let normalized = (Array.isArray(rawFiles) ? rawFiles : [])
          .map((f: any) => {
            const url: string = f?.url || f?.fileUrl || f?.downloadUrl || f?.cloudinaryUrl || f?.filePath || ""
            const name: string = f?.name || f?.title || f?.filename || f?.originalName || f?.publicId || f?.fileName || "ไฟล์ PDF"
            const mime: string | undefined = f?.mime || f?.mimeType || f?.contentType || f?.fileType || undefined
            return url ? { id: f?.id, name, url, mime } : null
          })
          .filter(Boolean) as { id?: string; name?: string; url: string; mime?: string }[]

        const pdfs = normalized.filter((f) => /pdf/i.test(f.mime || "") || /\.pdf(\?|$)/i.test(f.url))
        normalized = pdfs.length > 0 ? pdfs : normalized
        if (!cancelled) setFiles(normalized)

      
        if (!cancelled && normalized.length === 0) {
          try {
            const res2 = await fetch(`${EXAMS_API}/${encodeURIComponent(examId)}/files`, { cache: "no-store" })
            if (res2.ok) {
              const json2 = await res2.json().catch(() => ({}))
              const list = (json2?.data || json2 || []) as any[]
              let norm2 = (Array.isArray(list) ? list : [])
                .map((f: any) => {
                  const url: string = f?.url || f?.fileUrl || f?.downloadUrl || f?.cloudinaryUrl || f?.filePath || ""
                  const name: string = f?.name || f?.title || f?.filename || f?.originalName || f?.publicId || f?.fileName || "ไฟล์ PDF"
                  const mime: string | undefined = f?.mime || f?.mimeType || f?.contentType || f?.fileType || undefined
                  return url ? { id: f?.id, name, url, mime } : null
                })
                .filter(Boolean) as { id?: string; name?: string; url: string; mime?: string }[]
              const pdfs2 = norm2.filter((f) => /pdf/i.test(f.mime || "") || /\.pdf(\?|$)/i.test(f.url))
              norm2 = pdfs2.length > 0 ? pdfs2 : norm2
              if (!cancelled) setFiles(norm2)
            }
          } catch {}
        }
      } catch (e: any) {
        if (!cancelled) setFilesError(e?.message ?? "โหลดไฟล์ไม่สำเร็จ")
      } finally {
        if (!cancelled) setFilesLoading(false)
      }
    }

    if (selectedExam?.id) {
      loadFiles(selectedExam.id)
    } else {
      setFiles([])
      setFilesError(null)
      setFilesLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [selectedExam])

  const getCategoryColor = (name?: string) => {
    if (!name) return "rgb(250 202 21)"
    const match = categories.find((c) => c.name === name)
    return match?.color ?? "rgb(250 202 21)"
  }

  const uiExams: UiExam[] = useMemo(() => {
    return (data || [])
      .filter((e) => e.isActive)
      .map((e) => {
        const year = new Date(e.createdAt).getFullYear()
        const categoryName = e.category?.name ?? "ไม่ระบุ"
        return {
          id: e.id,
          title: e.title,
          categoryName,
          year,
          examType: categoryName,
          subject: undefined,
          pdfUrl: undefined,
          downloadUrl: undefined,
        }
      })
  }, [data])

  const availableYears = useMemo(
    () => Array.from(new Set(uiExams.map((exam) => exam.year))).sort((a, b) => b - a),
    [uiExams]
  )

  const categoriesForUI = useMemo(() => {
    if (categories.length) return categories
    const names = Array.from(new Set(uiExams.map((e) => e.categoryName).filter((n) => !!n))) as string[]
    return [{ id: "all", name: "ทั้งหมด", color: "rgb(250 202 21)" }, ...names.map((n, i) => ({ id: n, name: n, color: getCategoryColor(n) }))]
  }, [uiExams, categories])

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === "all") return null
    const found = categoriesForUI.find((c) => c.id === selectedCategory)
    return found?.name || null
  }, [selectedCategory, categoriesForUI])

  const filteredExams = useMemo(() => {
    return uiExams.filter((exam) => {
      const matchesCategory = selectedCategory === "all" || exam.categoryName === selectedCategoryName
      const matchesYear = selectedYear === "all" || exam.year.toString() === selectedYear
      const matchesSearch =
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.year.toString().includes(searchTerm)
      return matchesCategory && matchesYear && matchesSearch
    })
  }, [uiExams, selectedCategory, selectedCategoryName, selectedYear, searchTerm])

  const handleViewPDF = (examId: string) => {
    if (!examId) return
    router.push(`/exam-bank/view/${encodeURIComponent(examId)}`)
  }

  const handleDownload = (downloadUrl: string, filename?: string) => {
    if (!downloadUrl) return
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    const url = `/api/proxy-download?url=${encodeURIComponent(downloadUrl)}${filename ? `&filename=${encodeURIComponent(filename)}` : ""}`
    try {
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {}
  }

  // จำนวนการ์ดสเกเลตันตอนโหลด
  const SKELETON_COUNT = 8

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-white to-yellow-50 pt-20">
        <div className="container mx-auto px-4 py-8">
         
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">คลังข้อสอบ</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              รวบรวมข้อสอบฟิสิกส์และวิชาที่เกี่ยวข้องจากหลายปีการศึกษา พร้อมให้ดูและดาวน์โหลดฟรี
            </p>
          </motion.div>

       
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-row gap-3 items-center max-w-2xl mx-auto w-85 md:w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="ค้นหาข้อสอบ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
              <div className="shrink-0">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-33 sm:w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="เลือกปี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกปี</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        ปี {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

     
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            {loading && (
              <div className="flex flex-wrap justify-center gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 w-28 rounded-full shimmer" />
                ))}
              </div>
            )}
            {!loading && (
              <div className="flex flex-wrap justify-center gap-3">
                {categoriesForUI.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category.id ? "text-white shadow-lg transform scale-105" : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? getCategoryColor(category.name) : "transparent",
                      borderColor: getCategoryColor(category.name),
                      color: selectedCategory === category.id ? "white" : getCategoryColor(category.name),
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>

        
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-6"
          >
            {!loading && <p className="text-gray-600">พบข้อสอบ {filteredExams.length} รายการ</p>}
          </motion.div>

         
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {loading &&
              Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <div key={idx} className="h-full">
                  <Card className="h-full border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-8 w-8 rounded shimmer" />
                        <div className="h-5 w-12 rounded shimmer" />
                      </div>
                      <div className="h-6 w-3/4 rounded shimmer" />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-4 w-1/2 rounded shimmer mx-auto mt-2" />
                    </CardContent>
                  </Card>
                </div>
              ))}

            {!loading && error && (
              <div className="col-span-full text-center text-red-600 py-10">เกิดข้อผิดพลาด: {error}</div>
            )}

            {!loading &&
              !error &&
              filteredExams.map((exam, index) => {
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.06 * index }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <Card
                      className="h-full cursor-pointer transition-all duration-300 border-2 hover:shadow-xl"
                      style={{
                        borderColor: getCategoryColor(exam.categoryName) + "20",
                      }}
                      onMouseEnter={(e) => {
                        const c = getCategoryColor(exam.categoryName)
                        e.currentTarget.style.borderColor = c || "#000"
                        e.currentTarget.style.backgroundColor = c + "05"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = getCategoryColor(exam.categoryName) + "20"
                        e.currentTarget.style.backgroundColor = ""
                      }}
                      onClick={() => setSelectedExam(exam)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <FileText className="h-8 w-8 flex-shrink-0 mt-1" style={{ color: getCategoryColor(exam.categoryName) }} />
                          <Badge
                            variant="secondary"
                            className="text-white text-xs"
                            style={{ backgroundColor: getCategoryColor(exam.categoryName) }}
                          >
                            ปี {exam.year}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight text-gray-900">{exam.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center pt-2">
                          <p className="text-xs text-gray-500">คลิกเพื่อดูหรือดาวน์โหลด</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
          </motion.div>

        
          {!loading && !error && filteredExams.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบข้อสอบที่ค้นหา</h3>
              <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
            </motion.div>
          )}

  
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-16 p-8 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-2xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">ต้องการข้อสอบเพิ่มเติม?</h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              สมัครเรียนกับเราเพื่อเข้าถึงข้อสอบและเนื้อหาเพิ่มเติม พร้อมคำอธิบายและเทคนิคการแก้โจทย์จากอาจารย์เต้ย
            </p>
            <Link href="/courses">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full cursor-pointer">
                สมัครเรียนออนไลน์
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">{selectedExam?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">หมวดหมู่:</span>
                <p className="font-semibold">{selectedExam?.examType}</p>
              </div>
              <div>
                <span className="text-gray-600">ปี:</span>
                <p className="font-semibold">{selectedExam?.year}</p>
              </div>
            </div>

            <div className="pt-2">
              {filesLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-md border p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded shimmer" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-2/3 rounded shimmer" />
                          <div className="h-3 w-1/3 rounded shimmer" />
                        </div>
                        <div className="h-8 w-24 rounded shimmer" />
                        <div className="h-8 w-10 rounded shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!filesLoading && filesError && <p className="text-center text-red-600 py-2">{filesError}</p>}

              {!filesLoading && !filesError && files.length === 0 && (
                <p className="text-center text-gray-500 py-2">ไม่พบไฟล์สำหรับข้อสอบนี้</p>
              )}

              {!filesLoading && !filesError && files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, idx) => (
                    <div key={f.id || idx} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{f.name || "ไฟล์ PDF"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPDF(selectedExam?.id || "")}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                          ดูข้อสอบ
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(f.url, f.name || `${selectedExam?.title || "exam"}.pdf`)}
                          style={{ backgroundColor: getCategoryColor(selectedExam?.categoryName) }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

  
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <Footer />

     
      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            rgba(229, 229, 229, 1) 0%,
            rgba(243, 244, 246, 1) 50%,
            rgba(229, 229, 229, 1) 100%
          );
          background-size: 200% 100%;
          animation: shimmerSlide 1.4s ease-in-out infinite;
        }
        @keyframes shimmerSlide {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  )
}
