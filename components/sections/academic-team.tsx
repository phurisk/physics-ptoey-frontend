"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Teacher = {
  name: string
  subject: string
  image: string
  highlights?: string[]
}

const defaultTeachers: Teacher[] = [
  {
    name: "ครูพี่เต้ย",
    subject: "ฟิสิกส์",
    image: "/profile_about.png",
    highlights: [
      "คณะวิทยาศาสตร์ สาขาฟิสิกส์ จุฬาลงกรณ์มหาวิทยาลัย (Pure Physics)",
      "ที่ 1 ประเทศ ฟิสิกส์สามัญ 100/100",
      "ที่ 1 ประเทศตอบปัญหาวิศวกรรม ม.เกษตร",
      "ที่ 1 คะแนนรวมฟิสิกส์",
      "ที่ 1 กลุ่มจุฬาภรณ์ทั่วประเทศ",
      "อดีตนักเรียนโอลิมปิกฟิสิกส์ ศูนย์ศิลปากร",
      "นักเรียนทุนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย จ.เพชรบุรี",
      "อาจารย์พิเศษของห้องเรียนพิเศษทั่วประเทศ",
      "อาจารย์ดูแลเนื้อหาวิชาการของสถาบันชื่อดัง",
      "รับมอบหมายดูแลผู้แทนประเทศฟิสิกส์สัประยุทธ์ระดับนานาชาติ สสวท.",
      "รับเชิญเข้าร่วมประชุมอาจารย์ฟิสิกส์ศึกษาระดับชาติ",
    ],
  },
  {
    name: "ครูพี่ปลื้ม",
    subject: "ภาษาอังกฤษ",
    image: "/teacher-1.png",
    highlights: [
      "สอน ม.ปลาย มากกว่า 10 ปี พาน้องๆ สอบเข้ามหาลัยนับพันคน",
      "ปริญญาตรี อักษรศาสตร์ เอกภาษาอังกฤษ ม.ศิลปากร เกียรตินิยมอันดับ 2",
      "เจ้าของเพจ Engaholic ให้ความรู้ภาษาอังกฤษ ผู้ติดตาม 50,000+",
    ],
  },
  {
    name: "ครูพี่นัท",
    subject: "ภาษาจีน",
    image: "/teacher-2.png",
    highlights: [
      "มัธยมปลาย เอก อังกฤษ-จีน โรงเรียนสิรินธรราชวิทยาลัย",
      "ปริญญาตรี เอกจีน นักเรียนทุนแลกเปลี่ยน มหาวิทยาลัยชินโจว ประเทศจีน เกียรตินิยมอันดับ 1",
      "ประสบการณ์สอนและพานักเรียนแข่งขันภาษาจีน รางวัลระดับประเทศ",
    ],
  },
  {
    name: "ครูพี่แซน",
    subject: "เคมี",
    image: "/teacher-3.png",
    highlights: [
      "อดีตนักเรียนโอลิมปิกวิชาเคมี ในความควบคุมของมหาวิทยาลัยศิลปากร",
      "ชนะเลิศเหรียญทองฟิสิกส์สัประยุทธ์ของภาคกลางตอนล่าง",
      "ผ่านการคัดเลือกเข้าร่วม Thai Science Camp ครั้งที่ 10",
      "ผู้ช่วยจัดกิจกรรมการแข่งขันการตอบปัญหาวิชาการเคมี คณะวิทยาศาสตร์",
      "ฝึกงานด้านพิษวิทยา สถาบันนิติวิทยาศาสตร์ โรงพยาบาลตำรวจ",
      "ผู้ช่วยวิจัยศึกษาองค์ประกอบสารสกัดจากกัญชา ตีพิมพ์ในวารสารวิชาการ",
    ],
  },
  {
    name: "ครูพี่ยุ้ย",
    subject: "คณิตศาสตร์",
    image: "/teacher-4.png",
    highlights: [
      "ปริญญาตรี เอกคณิตศาสตร์ คณะครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
      "นักเรียนทุนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย จ.เพชรบุรี",
      "กำลังศึกษาปริญญาโท คณะวิทยาศาสตร์ สาขาคณิตศาสตร์ศึกษา ม.ศิลปากร",
    ],
  },
  {
    name: "ครูพี่อู๋",
    subject: "ชีววิทยา",
    image: "/teacher-5.png",
    highlights: ["เกียรตินิยมอันดับ 1 สาขาชีววิทยาโดยตรง คณะวิทยาศาสตร์ ม.ศิลปากร"],
  },
]

export default function AcademicTeam({ teachers = defaultTeachers }: { teachers?: Teacher[] }) {
  // จัดเรียงตามลำดับที่ต้องการ: ฟิสิกส์, เคมี, ชีววิทยา, คณิต, อังกฤษ, จีน
  const subjectOrder: Record<string, number> = useMemo(() => ({
    "ฟิสิกส์": 1,
    "เคมี": 2,
    "ชีววิทยา": 3,
    "ชีวะ": 3,
    "คณิตศาสตร์": 4,
    "คณิต": 4,
    "ภาษาอังกฤษ": 5,
    "ภาษาจีน": 6,
  }), [])

  const data = useMemo(() => {
    const raw = (teachers && teachers.length ? teachers : defaultTeachers).slice()
    raw.sort((a, b) => (subjectOrder[a.subject] ?? 99) - (subjectOrder[b.subject] ?? 99))
    return raw
  }, [teachers, subjectOrder])

  // กำหนดจำนวนการ์ดต่อหน้า ตามเบรกพอยท์: 1 / 2 / 3
  const [perView, setPerView] = useState(1)
  useEffect(() => {
    const calc = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setPerView(3)
      else if (window.matchMedia("(min-width: 768px)").matches) setPerView(2)
      else setPerView(1)
    }
    calc()
    const mqlMd = window.matchMedia("(min-width: 768px)")
    const mqlLg = window.matchMedia("(min-width: 1024px)")
    mqlMd.addEventListener("change", calc)
    mqlLg.addEventListener("change", calc)
    window.addEventListener("orientationchange", calc)
    window.addEventListener("resize", calc)
    return () => {
      mqlMd.removeEventListener("change", calc)
      mqlLg.removeEventListener("change", calc)
      window.removeEventListener("orientationchange", calc)
      window.removeEventListener("resize", calc)
    }
  }, [])

  // สร้างหน้าสไลด์ (page) ตาม perView
  const pages = useMemo(() => {
    const chunks: Teacher[][] = []
    for (let i = 0; i < data.length; i += perView) {
      chunks.push(data.slice(i, i + perView))
    }
    return chunks
  }, [data, perView])

  // ติดตามหน้าปัจจุบันจากการเลื่อน
  const viewportRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(0)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const pageWidth = el.clientWidth
        const idx = Math.round(el.scrollLeft / pageWidth)
        setActivePage(Math.min(Math.max(idx, 0), Math.max(0, pages.length - 1)))
        ticking = false
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [pages.length])

  // Modal แสดงประวัติแบบเด้ง ไม่ทำให้การ์ดยาว
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Teacher | null>(null)
  const openDetail = (t: Teacher) => { setSelected(t); setDetailOpen(true) }

  return (
    <section className="py-8 md:py-12 lg:py-14 px-4 md:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm">
            ทีมวิชาการ
          </h2>

        </div>


        <div className="relative">
          {/* ปุ่มเลื่อนซ้าย/ขวา */}
          {pages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="ก่อนหน้า"
                className={`absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow ring-1 ring-black/5 rounded-full p-2 disabled:opacity-40`}
                onClick={() => {
                  const el = viewportRef.current
                  if (!el) return
                  const target = Math.max(0, activePage - 1)
                  el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" })
                }}
                disabled={activePage <= 0}
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                type="button"
                aria-label="ถัดไป"
                className={`absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow ring-1 ring-black/5 rounded-full p-2 disabled:opacity-40`}
                onClick={() => {
                  const el = viewportRef.current
                  if (!el) return
                  const target = Math.min(pages.length - 1, activePage + 1)
                  el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" })
                }}
                disabled={activePage >= pages.length - 1}
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </>
          )}

          <div
            ref={viewportRef}
            className="hide-scrollbar flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
            style={{ scrollPaddingLeft: 16, scrollPaddingRight: 16 }}
            role="region"
            aria-label="สไลด์ทีมวิชาการ"
          >
          {pages.map((group, gi) => (
            <div key={gi} className="w-full shrink-0 snap-start px-2 md:px-3 lg:px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {group.map((t, i) => (
                  <Card
                    key={`${t.name}-${i}`}
                    className="border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl h-full"
                  >
                    <CardContent className="p-4 md:p-5 flex flex-col h-full">

                      <div className="flex justify-center mb-3 md:mb-4">
                        <Badge
                          variant="outline"
                          className="relative bg-white text-gray-900 border-0 rounded-none px-5 md:px-6 py-2 text-xl md:text-2xl font-bold tracking-wide before:content-[''] before:absolute before:left-3 before:right-3 before:bottom-0 before:h-[3px] before:bg-yellow-500 after:content-[''] after:absolute after:left-2 after:right-2 after:bottom-[6px] after:h-2 after:bg-yellow-100 after:-z-10"
                        >
                          <span className="relative z-[1]">{t.subject}</span>
                        </Badge>
                      </div>


                      <button
                        type="button"
                        onClick={() => openDetail(t)}
                        className="rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        aria-label={`ดูประวัติ ${t.name}`}
                      >
                        <div className="aspect-[3/4] w-full">
                          <Image
                            src={t.image || "/placeholder.svg"}
                            alt={t.name}
                            width={900}
                            height={1200}
                            className="h-full w-full object-cover"
                            priority={gi === 0 && i < 3}
                          />
                        </div>
                      </button>


                      <div className="mt-4 md:mt-5 flex-1 flex flex-col items-center">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 text-center">{t.name}</h3>
                        <Button
                          variant="outline"
                          className="mt-3 rounded-xl border-gray-200 hover:border-yellow-400 hover:bg-yellow-50"
                          onClick={() => openDetail(t)}
                        >
                          ดูประวัติ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>


        {pages.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 md:mt-6">
            {pages.map((_, i) => (
              <button
                key={i}
                aria-label={`ไปหน้า ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${i === activePage ? "bg-yellow-500 scale-110" : "bg-gray-300 hover:bg-gray-400"}`}
                onClick={() => {
                  const el = viewportRef.current
                  if (!el) return
                  el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
                }}
              />
            ))}
          </div>
        )}


        <style jsx global>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
          }
        `}</style>
      </div>

      {/* Dialog แสดงรายละเอียดครู */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">
              {selected?.name}
              {selected?.subject && (
                <span className="ml-2 align-middle">
                  <Badge className="bg-yellow-400 text-white rounded-full">{selected.subject}</Badge>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              {selected?.image && (
                <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                  <Image src={selected.image} alt={selected.name} width={600} height={800} className="w-full h-auto object-cover" />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              {selected?.highlights?.length ? (
                <ul className="space-y-2 text-sm md:text-base text-gray-700 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {selected.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2 leading-relaxed">
                      <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                      <span className="flex-1">{h}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">ไม่มีข้อมูลประวัติ</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
