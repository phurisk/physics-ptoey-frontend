"use client"

import { motion } from "framer-motion"
import HeroBanner from "@/components/sections/hero-banner"
import AboutTeacher from "@/components/sections/about-teacher"
import StudentSuccess from "@/components/sections/student-success"
import CourseStripes from "@/components/sections/course-stripes"
import Reviews from "@/components/sections/reviews"
import Books from "@/components/sections/books"
import Articles from "@/components/sections/articles"
import TeachingVideos from "@/components/sections/teaching-videos"
import { Footer } from "@/components/sections/footer"
import PopupPromotion from "@/components/sections/popup-promotion"
import AcademicTeam from "@/components/sections/academic-team"
import ViewOfTeaching from "@/components/sections/view-of-teaching"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

export default function HomePage() {
  return (
    <motion.div className="min-h-screen bg-white" initial="initial" animate="animate" variants={staggerContainer}>
      
      <PopupPromotion />

      <HeroBanner />

      <motion.div variants={fadeInUp}>
        <AboutTeacher />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <AcademicTeam />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <ViewOfTeaching />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <StudentSuccess />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <CourseStripes />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Reviews />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Books />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Articles />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <TeachingVideos />
      </motion.div>

      <Footer />
    </motion.div>
  )
}
