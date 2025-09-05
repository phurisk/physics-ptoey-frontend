"use client"

import { useMemo } from "react"
import { MotionConfig, motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/sections/footer"


const studyPlans = [
  {
    id: 1,
    image: "/student-plan1.jpeg",
  },
  {
    id: 2,
    image: "/student-plan2.jpeg",
  },
  {
    id: 3,
    image: "/student-plan3.jpeg",
  },
  {
    id: 4,
    image: "/student-plan4.jpeg",
  },
]


export default function StudentWorksPage() {
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
            <ElegantStack items={studyPlans} />
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
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
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
  work: { id: number; image: string }
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
        <Image
          src={work.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          fetchPriority={index < 1 ? "high" : undefined}
        />
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
