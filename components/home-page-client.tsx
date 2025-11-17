"use client"

import dynamic from "next/dynamic"
import AboutTeacher from "@/components/sections/about-teacher"
import CourseStripes from "@/components/sections/course-stripes"
import { Footer } from "@/components/sections/footer"
import DeferredRender from "@/components/deferred-render"

const HeroBanner = dynamic(() => import("@/components/sections/hero-banner"), {
  loading: () => <SectionSkeleton label="กำลังโหลดแบนเนอร์..." />,
  ssr: false,
})

const PopupPromotion = dynamic(() => import("@/components/sections/popup-promotion"), { ssr: false, loading: () => null })
const AcademicTeam = dynamic(() => import("@/components/sections/academic-team"), { ssr: false })
const ViewOfTeaching = dynamic(() => import("@/components/sections/view-of-teaching"), { ssr: false })
const StudentSuccess = dynamic(() => import("@/components/sections/student-success"), { ssr: false })
const Reviews = dynamic(() => import("@/components/sections/reviews"), { ssr: false })
const Books = dynamic(() => import("@/components/sections/books"), { ssr: false })
const Articles = dynamic(() => import("@/components/sections/articles"), { ssr: false })
const TeachingVideos = dynamic(() => import("@/components/sections/teaching-videos"), { ssr: false })

const SectionSkeleton = ({ label }: { label: string }) => (
  <section className="px-4 py-6 md:px-8 md:py-10 animate-pulse">
    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
    <div className="h-32 bg-gray-100 rounded" />
    <p className="text-xs text-gray-400 mt-4">{label}</p>
  </section>
)

export default function HomePageClient() {
  return (
    <div className="min-h-screen bg-white">
      <PopupPromotion />
      <HeroBanner />
      <section>
        <AboutTeacher />
      </section>

      <DeferredRender fallback={<SectionSkeleton label="ทีมวิชาการกำลังโหลด..." />}>
        {() => <AcademicTeam />}
      </DeferredRender>

      <DeferredRender fallback={<SectionSkeleton label="บรรยากาศการเรียนกำลังโหลด..." />}>
        {() => <ViewOfTeaching />}
      </DeferredRender>

      <DeferredRender fallback={<SectionSkeleton label="ผลงานนักเรียนกำลังโหลด..." />}>
        {() => <StudentSuccess />}
      </DeferredRender>

      <section>
        <CourseStripes />
      </section>

      <DeferredRender fallback={<SectionSkeleton label="รีวิวกำลังโหลด..." />}>
        {() => <Reviews />}
      </DeferredRender>

      <DeferredRender fallback={<SectionSkeleton label="หนังสือแนะนำกำลังโหลด..." />}>
        {() => <Books />}
      </DeferredRender>

      <DeferredRender fallback={<SectionSkeleton label="บทความกำลังโหลด..." />}>
        {() => <Articles />}
      </DeferredRender>

      <DeferredRender fallback={<SectionSkeleton label="วิดีโอกำลังโหลด..." />}>
        {() => <TeachingVideos />}
      </DeferredRender>

      <Footer />
    </div>
  )
}
