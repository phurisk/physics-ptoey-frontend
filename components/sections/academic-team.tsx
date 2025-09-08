"use client"

import Image from "next/image"
import { motion } from "framer-motion"

type Member = {
  name: string
  subject: string
  image?: string
  highlights: string[]
}

const members: Member[] = [
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

const fadeIn = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 } },
}

export default function AcademicTeam() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 bg-[#ffbf00] px-8 py-4 w-fit mx-auto rounded-full shadow-sm">
            ทีมวิชาการ
          </h2>
          <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            ครูผู้เชี่ยวชาญหลายสาขา ร่วมออกแบบหลักสูตรและดูแลเนื้อหาอย่างเข้มข้น
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {members.map((m, i) => (
            <motion.div key={m.name} variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
              <article className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 bg-gradient-to-br from-white to-yellow-50/30 p-6 h-full flex flex-col">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden bg-blue-50 ring-1 ring-black/5 shadow-sm">
                    <Image
                      src={m.image || "/placeholder.svg"}
                      alt={m.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-5">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                      {m.name} <span className="text-[#2688DF]">({m.subject})</span>
                    </h3>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-gray-700 text-sm md:text-[15px] leading-relaxed list-none">
                  {m.highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[#FEBE01] flex-shrink-0" />
                      <span className="text-pretty">{h}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
