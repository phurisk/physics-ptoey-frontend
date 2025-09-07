"use client"

import { useEffect, useMemo, useState } from "react"
import { MotionConfig, motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"


type WorkItem = {
  id: string | number
  imageDesktop: string
  imageMobile: string
}

const studyPlans: WorkItem[] = [
  {
    id: 1,
    imageDesktop: "/student-plan1.jpeg",
    imageMobile: "/student-plan1.jpeg",
  },
  {
    id: 2,
    imageDesktop: "/student-plan2.jpeg",
    imageMobile: "/student-plan2.jpeg",
  },
  {
    id: 3,
    imageDesktop: "/student-plan3.jpeg",
    imageMobile: "/student-plan3.jpeg",
  },
  {
    id: 4,
    imageDesktop: "/student-plan4.jpeg",
    imageMobile: "/student-plan4.jpeg",
  },
]


export default function StudentWorksPage() {
  const [items, setItems] = useState<typeof studyPlans>(studyPlans)

 
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const params = new URLSearchParams({ postType: "แผนการเรียน" })
        const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" })
        if (res.ok) {
          console.log("[StudyPlans] Fetch /api/posts: OK", res.status)
        } else {
          console.warn("[StudyPlans] Fetch /api/posts: NOT OK", res.status, res.statusText)
        }
        const json: any = await res.json().catch(() => null)

        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
        if (!list.length) {
          console.warn(
            `[StudyPlans] API ไม่มีข้อมูลโพสต์ ใช้รูป dummy แทน (${studyPlans.length} ภาพ)`
          )
          return
        } else {
          console.log(`[StudyPlans] Posts loaded: ${list.length}`)
        }

        const mapped: WorkItem[] = list
          .map((p: any, idx: number) => {
            const desktop = p?.imageUrl || p?.imageUrlMobileMode || ""
            const mobile = p?.imageUrlMobileMode || p?.imageUrl || ""
            return {
              id: p?.id ?? idx,
              imageDesktop: desktop,
              imageMobile: mobile,
            }
          })
          .filter((s: WorkItem) => !!(s.imageDesktop || s.imageMobile))

        console.log(`[StudyPlans] Slides mapped: ${mapped.length}`)

        if (mounted && mapped.length) {
          setItems(mapped as any)
          console.log(`[StudyPlans] ใช้รูปจาก API จำนวน ${mapped.length} ภาพ`)
        } else if (mounted) {
          console.warn(
            `[StudyPlans] API ไม่มีรูป (imageUrl/imageUrlMobileMode) ใช้รูป dummy แทน (${studyPlans.length} ภาพ)`
          )
        }
      } catch (err) {
        console.error("[StudyPlans] Failed to load posts", err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])
  return (
    <MotionConfig transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      <Navigation />
      <main className="min-h-screen bg-white">


        <section className="relative">

          <div className="pointer-events-none absolute inset-0">

            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-yellow-50 via-yellow-50/40 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-yellow-50 via-yellow-50/40 to-transparent" />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(1200px 400px at 50% -200px, rgba(253, 224, 71, .22), transparent 60%)",
              }}
            />

            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 1px, transparent 1px, transparent 48px)",
              }}
            />
          </div>


          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
            <ElegantStack items={items} />
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 bg-yellow-400"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              คุณก็สามารถเป็นส่วนหนึ่งของความสำเร็จได้
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              เริ่มต้นการเรียนรู้ฟิสิกส์กับเราวันนี้
            </p>
            <Link
              href="/courses"
              className="inline-block bg-white text-yellow-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300"
            >
              สมัครเรียนเลย
            </Link>
          </div>
        </motion.section>
      </main>
      <Footer />
    </MotionConfig>
  )
}


function ElegantStack({ items }: { items: typeof studyPlans }) {
  const layout = useMemo(() => items, [items])

  return (
    <motion.div
      initial={false}
      whileInView="show"
      viewport={{ once: true, amount: 0.01 }}
      variants={{
        hidden: { opacity: 1 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.12, delayChildren: 0.04 },
        },
      }}
      className="mx-auto max-w-3xl space-y-8 sm:space-y-10"
    >
      {layout.map((work, i) => (
        <ElegantTile key={work.id} work={work} index={i} />
      ))}
    </motion.div>
  )
}

function ElegantTile({
  work,
  index,
}: {
  work: WorkItem
  index: number
}) {
  const variants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 18, scale: 0.992, filter: "blur(4px)" },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.55 },
      },
    }),
    []
  )

  return (
    <motion.figure variants={variants}>
      <TileFrame>
        {/** Desktop (md+) ใช้ imageUrl */}
        {work.imageDesktop && (
          <Image
            src={work.imageDesktop}
            alt=""
            fill
            sizes="(min-width: 768px) 100vw, 0px"
            className="object-cover hidden md:block"
            fetchPriority={index < 1 ? "high" : undefined}
          />
        )}
        {/** Mobile (< md) ใช้ imageUrlMobileMode */}
        {work.imageMobile && (
          <Image
            src={work.imageMobile}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 0px"
            className="object-cover md:hidden"
            fetchPriority={index < 1 ? "high" : undefined}
          />
        )}
      </TileFrame>
    </motion.figure>
  )
}


function TileFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="relative rounded-2xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.07)] ring-1 ring-black/5 bg-white/80"
      style={{ transformStyle: "preserve-3d" }}
    >

      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] md:aspect-[2/3]">
        <div className="absolute inset-0">{children}</div>


      </div>
    </motion.div>
  )
}
