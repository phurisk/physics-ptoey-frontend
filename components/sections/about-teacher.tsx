import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"
import { Award, Target } from "lucide-react"

export default function AboutTeacher() {

  return (
    <section className="pt-10 pb-10 lg:pt-24 lg:pb-5 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

      
          <div className="order-1 lg:order-2 lg:col-span-1 space-y-4 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 text-balance">พี่เต้ย (อ.เชษฐา)</h2>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900 text-pretty">โรงเรียนกวดวิชาฟิสิกส์อาจารย์เต้ย</h3>
              <p className="text-gray-600 text-pretty">(ในความควบคุมของกระทรวงศึกษาธิการ)</p>
            </div>
          </div>

        
          <div className="order-2 lg:order-1 lg:row-span-2">
            <div className="relative w-full max-w-[260px] sm:max-w-sm md:max-w-md mx-auto lg:mx-0">
              <Card className="overflow-hidden shadow-2xl p-0">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src="/teacher(1).png"
                      alt="พี่เต้ย (อ.เชษฐา)"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                </CardContent>
              </Card>


              <div className="absolute -right-3 -bottom-3 z-10 bg-yellow-400 text-white rounded-2xl shadow-xl p-3 md:p-4">
                <Award className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </div>

           
            <div className="mt-10 hidden md:flex flex-row gap-3 justify-center lg:justify-start flex-nowrap mb-10 ">
              <Link
                href="/courses"
                className="min-w-[160px] px-4 py-2 text-lg md:min-w-[220px] md:px-8 md:py-3 md:text-xl
                  bg-[#2688DF] hover:bg-[#1f6fba] text-white rounded-lg font-semibold 
                  shadow-md hover:shadow-lg transition-transform duration-300 
                  cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
              >
                คอร์สออนไลน์
                <svg
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  className="w-5 h-5 md:w-7 md:h-7"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    d="M26 22H6c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4h20c2.2 0 4 1.8 4 4v10c0 2.2-1.8 4-4 4M3 27h4m4 0h18"
                  />
                  <circle cx="9" cy="27" r="2" fill="white" />
                  <path
                    d="M13 10v6c0 .7.9 1.2 1.5.8l5-3c.6-.4.6-1.2 0-1.6l-5-3c-.6-.5-1.5 0-1.5.8"
                    fill="white"
                  />
                </svg>
              </Link>

              <Link
                href="/live"
                className="min-w-[160px] px-4 py-2 text-lg md:min-w-[250px] md:px-8 md:py-3 md:text-xl
                  bg-[#FEBE01] hover:bg-[#e5aa00] text-black rounded-lg font-semibold 
                  shadow-md hover:shadow-lg transition-transform duration-300 
                  cursor-pointer flex items-center justify-center gap-2 hover:scale-105 text-nowrap"
              >
                คอร์สสอนสด Live
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="w-5 h-5 md:w-8 md:h-8"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path
                    d="M16 4a1 1 0 0 1 1 1v4.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm-1 2H3v12h12zM7.4 8.829a.4.4 0 0 1 .215.062l4.355 2.772a.4.4 0 0 1 0 .674L7.615 15.11A.4.4 0 0 1 7 14.77V9.23a.4.4 0 0 1 .4-.4zM21 8.84l-4 2.8v.718l4 2.8z"
                    fill="red"
                  />
                </svg>
              </Link>
            </div>
          </div>

       
          <div className="order-3 lg:order-3 lg:col-span-1 space-y-8 max-w-2xl mx-auto lg:mx-0 text-left">
           
            <div className="space-y-6">
              <h4 className="text-2xl font-semibold text-gray-900 flex items-center justify-start gap-2">
                <Award className="h-6 w-6 text-yellow-500" /> ประวัติ / ประสบการณ์การสอน
              </h4>
              <div className="space-y-3">
                {[
                  "ที่ 1 ฟิสิกส์สามัญ ประเทศ",
                  "ชนะเลิศการแข่งขันฟิสิกส์สัประยุทธ์\nกลุ่มภาคกลางและกลุ่มภาคตะวันออก",
                  "ที่ 1 ชนะเลิศการตอบปัญหาวิศวกรรมศาสตร์ \n(มหาวิทยาลัยเกษตรศาสตร์)",
                  "นักเรียนฟิสิกส์โอลิมปิค มหาวิทยาลัยศิลปากร (สนามจันทร์)",
                  "นักเรียนทุนส่งเสริมความเป็นเลิศทางวิทยาศาสตร์และเทคโนโลยี JSTP ของสวทช และอพวช",
                  "รับเชิญเข้าร่วมประชุมสัมนาฟิสิกส์ศึกษา เกี่ยวกับการเรียนการสอนและงานวิจัยด้านฟิสิกส์ศึกษาของประเทศไทย",
                ].map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                    className="flex items-start gap-3 min-w-0"
                  >
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed text-pretty break-words whitespace-pre-line sm:whitespace-normal">{achievement}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-2xl font-semibold text-gray-900 flex items-center justify-start gap-2">
                <Target className="h-6 w-6 text-yellow-500" /> ปัจจุบัน
              </h4>
              <div className="flex flex-wrap gap-2">
                {["อาจารย์ฟิสิกส์ สถาบันฟิสิกส์ อ.เต้ย", "อาจารย์พิเศษห้องเรียนพิเศษทั่วประเทศ"].map(
                  (position, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm cursor-default"
                    >
                      {position}
                    </Badge>
                  )
                )}
              </div>
            </div>

           
            <div className="mt-6 flex flex-row gap-3 justify-center flex-nowrap md:hidden">
              <Link
                href="/courses"
                className="min-w-[140px] px-4 py-2 text-base sm:text-lg
                  bg-[#2688DF] hover:bg-[#1f6fba] text-white rounded-lg font-semibold whitespace-nowrap
                  shadow-md hover:shadow-lg transition-transform duration-300 
                  cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
              >
                คอร์สออนไลน์
                <svg
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    d="M26 22H6c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4h20c2.2 0 4 1.8 4 4v10c0 2.2-1.8 4-4 4M3 27h4m4 0h18"
                  />
                  <circle cx="9" cy="27" r="2" fill="white" />
                  <path
                    d="M13 10v6c0 .7.9 1.2 1.5.8l5-3c.6-.4.6-1.2 0-1.6l-5-3c-.6-.5-1.5 0-1.5.8"
                    fill="white"
                  />
                </svg>
              </Link>

              <Link
                href="/live"
                className="min-w-[140px] px-4 py-2 text-base sm:text-lg
                  bg-[#FEBE01] hover:bg-[#e5aa00] text-black rounded-lg font-semibold whitespace-nowrap
                  shadow-md hover:shadow-lg transition-transform duration-300 
                  cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
              >
                คอร์สสอนสด Live
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path
                    d="M16 4a1 1 0 0 1 1 1v4.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm-1 2H3v12h12zM7.4 8.829a.4.4 0 0 1 .215.062l4.355 2.772a.4.4 0 0 1 0 .674L7.615 15.11A.4.4 0 0 1 7 14.77V9.23a.4.4 0 0 1 .4-.4zM21 8.84l-4 2.8v.718l4 2.8z"
                    fill="red"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
