"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

type Teacher = {
  name: string
  role: string
  subject: string
  image: string
  highlights?: string[]
}

const defaultTeachers: Teacher[] = [
  {
    name: "ครูพี่เต้ย",
    role: "ม.ปลาย",
    subject: "ฟิสิกส์",
    image: "/teacher-0.jpg",
    highlights: [
      "ที่ 1 ฟิสิกส์สามัญ ประเทศไทย",
      "ชนะเลิศการแข่งขันฟิสิกส์สัประยุทธ์ กลุ่มภาคกลางและภาคตะวันออก(จุฬาลงกรณ์ฯ)",
      "ชนะเลิศการตอบปัญหาวิศวกรรมศาสตร์ (มหาวิทยาลัยเกษตรศาสตร์)",
      "นักเรียนฟิสิกส์โอลิมปิค มหาวิทยาลัยศิลปากร \n(สนามจันทร์)",
      "นักเรียนทุนส่งเสริมความเป็นเลิศทางวิทยาศาสตร์และเทคโนโลยี JSTP ของสวทช",
      "รับเชิญเข้าร่วมประชุมสัมนาฟิสิกส์ศึกษา เกี่ยวกับการเรียนการสอนและงานวิจัยด้านฟิสิกส์ศึกษาของประเทศไทย",
      "ผู้ช่วยดูแลการทดลองผู้แทนฟิสิกส์ประยุกต์ระดับนานาชาติ ของจุฬาลงกรณ์มหาวิทยาลัย",
    ],
  },
  {
    name: "ครูพี่แซน",
    role: "ม.ปลาย",
    subject: "เคมี",
    image: "/teacher-1.jpg",
    highlights: [
      "อดีตนักเรียนโอลิมปิกวิชาเคมี ในความควบคุมของมหาวิทยาลัยศิลปากร",
      "ชนะเลิศเหรียญทองฟิสิกส์สัประยุทธ์ของภาคกลางตอนล่าง",
      "ผ่านการคัดเลือกเข้าร่วม Thai Science Camp \nครั้งที่ 10",
      "ผู้ช่วยจัดกิจกรรมการแข่งขันการตอบปัญหาวิชาการเคมี คณะวิทยาศาสตร์",
      "ฝึกงานด้านพิษวิทยา สถาบันนิติวิทยาศาสตร์ \nโรงพยาบาลตำรวจ",
      "ผู้ช่วยวิจัยศึกษาองค์ประกอบสารสกัดจากกัญชา ตีพิมพ์ในวารสารวิชาการ",
    ],
  },
  {
    name: "ครูพี่แจม",
    role: "ม.ปลาย",
    subject: "ชีววิทยา",
    image: "/teacher-2.jpg",
    highlights: [
      "เกียรตินิยมอันดับ 2 วท.บ. ชีววิทยา คณะวิทยาศาสตร์ จุฬาฯ (2559–2562)",
      "กำลังศึกษาระดับมหาบัณฑิต คณะครุศาสตร์ จุฬาฯ (2567–ปัจจุบัน)",
      "ผู้ช่วยนักวิจัย คณะแพทยศาสตร์ จุฬาฯ (2563)",
      "ประสบการณ์สอนชีววิทยา 10 ปี (ม.4–6/เตรียมสอบเข้ามหาวิทยาลัย)",
      "ผ่านการคัดเลือกโครงการ สอวน. ชีววิทยา (2558)",
      "ทีมออกข้อสอบชีววิทยา TCASter (ร่วมกับจุฬาลงกรณ์มหาวิทยาลัย)",
      "ชนะเลิศงานตอบปัญหาสุขภาพและพระราชประวัติพระบิดา (คณะแพทยศาสตร์ จุฬาฯ)",
      "Outstanding student (Top score) ในวิชา Invertebrate Zoology ปีการศึกษา 2018",
      "เจ้าของเพจ “Biosensor” คอร์สเรียนชีววิทยาออนไลน์"
    ],
  },
  {
    name: "ครูพี่อู๋",
    role: "ม.ต้น",
    subject: "ชีววิทยา",
    image: "/teacher-3.jpg",
    highlights: ["เกียรตินิยมอันดับ 1 สาขาชีววิทยาโดยตรง \nคณะวิทยาศาสตร์ ม.ศิลปากร"],
  },

  {
    name: "ครูพี่ยุ้ย",
    role: "ม.ปลาย",
    subject: "คณิตศาสตร์",
    image: "/teacher-4.jpg",
    highlights: [
      "ปริญญาตรี เอกคณิตศาสตร์ คณะครุศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
      "นักเรียนทุนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย จ.เพชรบุรี",
      "กำลังศึกษาปริญญาโท คณะวิทยาศาสตร์ สาขาคณิตศาสตร์ศึกษา ม.ศิลปากร",
    ],
  },
  {
    name: "ครูพี่ปลื้ม",
    role: "ม.ปลาย",
    subject: "ภาษาอังกฤษ",
    image: "/teacher-5.jpg",
    highlights: [
      "สอน ม.ปลาย มากกว่า 10 ปี พาน้องๆ สอบเข้ามหาลัยนับพันคน",
      "ปริญญาตรี อักษรศาสตร์ เอกภาษาอังกฤษ ม.ศิลปากร เกียรตินิยมอันดับ 2",
      "เจ้าของเพจ Engaholic ให้ความรู้ภาษาอังกฤษ ผู้ติดตาม 50,000+",
    ],
  },
  {
    name: "ครูพี่นัท",
    role: "ม.ปลาย",
    subject: "ภาษาจีน",
    image: "/teacher-6.jpg",
    highlights: [
      "มัธยมปลาย เอก อังกฤษ-จีน โรงเรียนสิรินธรราชวิทยาลัย",
      "ปริญญาตรี เอกจีน นักเรียนทุนแลกเปลี่ยน มหาวิทยาลัยชินโจว ประเทศจีน เกียรตินิยมอันดับ 1",
      "ประสบการณ์สอนและพานักเรียนแข่งขันภาษาจีน รางวัลระดับประเทศ",
    ],
  },

]

export default function AcademicTeam({ teachers = defaultTeachers }: { teachers?: Teacher[] }) {
  const subjectOrder: Record<string, number> = useMemo(
    () => ({
      ฟิสิกส์: 1,
      เคมี: 2,
      ชีววิทยา: 3,
      ชีวะ: 3,
      คณิตศาสตร์: 4,
      คณิต: 4,
      ภาษาอังกฤษ: 5,
      ภาษาจีน: 6,
    }),
    [],
  )

  const data = useMemo(() => {
    const raw = (teachers && teachers.length ? teachers : defaultTeachers).slice()
    raw.sort((a, b) => (subjectOrder[a.subject] ?? 99) - (subjectOrder[b.subject] ?? 99))
    return raw
  }, [teachers, subjectOrder])

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

  const viewportRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => {
      const first = el.querySelector<HTMLElement>(".carousel-item")
      const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "0")
      if (first) setStep(first.getBoundingClientRect().width + gap)
    }
    measure()
    const onScroll = () => {
      if (!step) return
      const idx = Math.round(el.scrollLeft / step)
      setActiveIndex(Math.min(Math.max(idx, 0), data.length - 1))
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
    }
  }, [data.length, step])

  const scrollToIndex = (i: number) => {
    const el = viewportRef.current
    if (!el || !step) return
    const maxLeft = el.scrollWidth - el.clientWidth
    const left = Math.min(Math.max(i * step, 0), maxLeft)
    el.scrollTo({ left, behavior: "smooth" })
  }

  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Teacher | null>(null)
  const openDetail = (t: Teacher) => {
    setSelected(t)
    setDetailOpen(true)
  }

  return (
    <section className="py-8 md:py-12 lg:py-14 px-4 md:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm">
            ทีมวิชาการ
          </h2>
        </div>

        <div className="relative">
          {data.length > 1 && (
            <>
              <button
                type="button"
                aria-label="ก่อนหน้า"
                className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow ring-1 ring-black/5 rounded-full p-2 disabled:opacity-40"
                onClick={() => scrollToIndex(activeIndex - 1)}
                disabled={activeIndex <= 0}
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                type="button"
                aria-label="ถัดไป"
                className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow ring-1 ring-black/5 rounded-full p-2 disabled:opacity-40"
                onClick={() => scrollToIndex(activeIndex + 1)}
                disabled={activeIndex >= data.length - 1}
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </>
          )}

          <div
            ref={viewportRef}
            className="hide-scrollbar flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 md:gap-6 lg:gap-8 px-2 md:px-3 lg:px-4"
            role="region"
            aria-label="สไลด์ทีมวิชาการ"
          >
            {data.map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="carousel-item snap-start shrink-0 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl h-full">
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
                          priority={i < 3}
                        />
                      </div>
                    </button>

                    <div className="mt-4 md:mt-5 flex-1 flex flex-col items-center">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 text-center">{t.name}</h3>
                      <p className="text-sm text-yellow-600 relative top-[4px]">{t.role}</p>
                      <Button
                        variant="outline"
                        className="mt-3 rounded-xl border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 bg-transparent"
                        onClick={() => openDetail(t)}
                      >
                        ดูประวัติ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {data.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 md:mt-6">
            {data.map((_, i) => (
              <button
                key={i}
                aria-label={`ไปการ์ดที่ ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${i === activeIndex ? "bg-yellow-500 scale-110" : "bg-gray-300 hover:bg-gray-400"}`}
                onClick={() => scrollToIndex(i)}
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          showCloseButton={false}
          className=" p-0 bg-white rounded-none sm:rounded-2xl w-full h-[100dvh] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl top-0 left-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] overflow-hidden"
        >
          <button
            type="button"
            aria-label="ปิด"
            onClick={() => setDetailOpen(false)}
            className="absolute top-4 right-4 z-30 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm text-gray-700 shadow-lg ring-1 ring-black/10 hover:bg-white hover:shadow-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex h-full w-full flex-col overflow-hidden min-h-0 ">
            <div className="sm:hidden h-full flex flex-col overflow-hidden">
              <div className="relative w-full h-[25vh] bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                {selected?.image && (
                  <Image
                    src={selected.image || "/placeholder.svg"}
                    alt={selected.name}
                    fill
                    className="object-contain object-center select-none"
                    sizes="100vw"
                    priority
                  />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-16">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {selected?.subject && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full px-3 py-1 text-sm font-medium shadow-lg">
                        {selected.subject}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-white text-xl font-bold drop-shadow-lg">{selected?.name}</h3>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-white">
                <div className="h-full overflow-y-auto custom-scrollbar snap-y snap-mandatory scroll-pt-16">
                  <div className="p-4 pb-8">
                    <div className="sticky top-0 bg-white z-10 pb-3 mb-4 border-b border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900">ประวัติและผลงาน</h4>
                    </div>
                    {selected?.highlights?.length ? (
                      <ul className="space-y-3 text-sm leading-relaxed text-gray-700">
                        {selected.highlights.map((h, i) => (
                          <li key={i} className="flex gap-3 p-3 bg-gray-50/50 rounded-lg snap-start">
                            <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
                            <span className="flex-1">{h}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-gray-500 py-8">ไม่มีข้อมูลประวัติ</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogHeader className="hidden sm:flex px-8 pt-8 pb-4 border-b border-gray-100">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                {selected?.name}
                {selected?.subject && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full px-4 py-2 text-base font-medium">
                    {selected.subject}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-5 gap-8 p-8 bg-white overflow-hidden flex-1 min-h-0">
              <div className="lg:col-span-2">
                {selected?.image && (
                  <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                    <Image
                      src={selected.image || "/placeholder.svg"}
                      alt={selected.name}
                      fill
                      className="object-contain object-center select-none"
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      priority
                    />
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
                <h4 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-yellow-500 flex-shrink-0">
                  ประวัติและผลงาน
                </h4>
                {selected?.highlights?.length ? (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar snap-y snap-mandatory scroll-pt-20 min-h-0">
                    <ul className="space-y-4 text-base md:text-lg text-gray-700">
                      {selected.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex gap-4 p-4 bg-gray-50/80 rounded-xl hover:bg-gray-50 transition-colors duration-200 snap-start"
                        >
                          <span className="mt-2.5 inline-block h-2.5 w-2.5 rounded-full bg-yellow-500 flex-shrink-0" />
                          <span className="flex-1 leading-relaxed">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">ไม่มีข้อมูลประวัติ</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
