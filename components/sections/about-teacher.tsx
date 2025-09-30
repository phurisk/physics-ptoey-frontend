import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"
import { Award, Target, GraduationCap, School } from "lucide-react"

export default function AboutTeacher() {
  return (
    <section className="pt-10 pb-10 lg:pt-24 lg:pb-5 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-12 items-start">
          <div className="space-y-4 text-center md:text-left max-w-2xl mx-auto md:mx-0 md:col-span-7 md:col-start-6 md:row-start-1">
            <h2 className="text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-balance">พี่เต้ย (อ.เชษฐา)</h2>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900 text-pretty">โรงเรียนกวดวิชาฟิสิกส์อาจารย์เต้ย</h3>
              <p className="text-gray-600 text-pretty">(ในความควบคุมของกระทรวงศึกษาธิการ)</p>
            </div>
          </div>

          <div className="md:col-span-5 md:col-start-1 md:row-start-1 md:row-span-2">
            <div className="relative w-full max-w-[260px] sm:max-w-sm md:max-w-none mx-auto md:mx-0">
              <Card className="overflow-hidden shadow-2xl p-0">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src="/teacher(1).png"
                      alt="พี่เต้ย (อ.เชษฐา)"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 45vw, 520px"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                </CardContent>
              </Card>
              <div className="absolute right-2 bottom-2 md:right-4 md:bottom-4 z-10 bg-yellow-400 text-white rounded-2xl shadow-xl p-3 md:p-4">
                <Award className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto md:mx-0 text-left md:col-span-7 md:col-start-6 md:row-start-2 space-y-8">
            <div className="space-y-6">
              <h4 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" /> ประสบการณ์ / ผลงาน
              </h4>
              <div className="space-y-3">
                {[
                  "ที่ 1 ฟิสิกส์สามัญ ประเทศไทย",
                  "ชนะเลิศการแข่งขันฟิสิกส์สัประยุทธ์\nกลุ่มภาคกลางและภาคตะวันออก(จุฬาลงกรณ์ฯ)",
                  "ชนะเลิศการตอบปัญหาวิศวกรรมศาสตร์ \n(มหาวิทยาลัยเกษตรศาสตร์)",
                  "นักเรียนฟิสิกส์โอลิมปิค มหาวิทยาลัยศิลปากร (สนามจันทร์)",
                  "นักเรียนทุนส่งเสริมความเป็นเลิศทางวิทยาศาสตร์และเทคโนโลยี JSTP ของสวทช",
                  "รับเชิญเข้าร่วมประชุมสัมนาฟิสิกส์ศึกษา เกี่ยวกับการเรียนการสอนและงานวิจัยด้านฟิสิกส์ศึกษาของประเทศไทย",
                  "ผู้ช่วยดูแลการทดลองผู้แทนฟิสิกส์ประยุกต์ระดับนานาชาติ ของจุฬาลงกรณ์มหาวิทยาลัย"

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
                    <p className="text-gray-700 leading-relaxed text-pretty break-words whitespace-pre-line sm:whitespace-normal">
                      {achievement}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-yellow-500" /> ปัจจุบัน
              </h4>
              <div className="flex flex-wrap gap-2">
                {["อาจารย์ฟิสิกส์ สถาบันฟิสิกส์ อ.เต้ย", "อาจารย์พิเศษห้องเรียนพิเศษทั่วประเทศ"].map((position, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm cursor-default"
                  >
                    {position}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-12 md:col-start-1 md:row-start-3">
            <div className="max-w-5xl mx-auto">
              <h4 className="text-2xl font-semibold text-gray-900 flex items-center justify-start gap-2 mb-6">
                <GraduationCap className="h-6 w-6 text-blue-600" /> การศึกษา
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-white rounded-lg p-2 shadow-sm flex items-center justify-center w-20 h-20">
                      <img src="/logo/โรงเรียนจุฬาภรณราชวิทยาลัย.png" alt="โรงเรียนจุฬาภรณราชวิทยาลัย" width={50} height={50} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">มัธยมศึกษา</h5>
                      <p className="text-gray-700 leading-relaxed">นักเรียนทุนโรงเรียนจุฬาภรณราชวิทยาลัย เพชรบุรี</p>
                      <p className="text-sm text-gray-600 mt-1">(โรงเรียนวิทยาศาสตร์ภูมิภาค)</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-white rounded-lg p-2 shadow-sm flex items-center justify-center w-20 h-20">
                      <img src="/logo/science_chula.png" alt="โรงเรียนจุฬาภรณราชวิทยาลัย" width={100} height={100} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">ปริญญาตรี</h5>
                      <p className="text-gray-700 leading-relaxed">คณะวิทยาศาสตร์ (ฟิสิกส์)</p>
                      <p className="text-sm text-gray-600 mt-1">จุฬาลงกรณ์มหาวิทยาลัย</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-white rounded-lg p-2 shadow-sm flex items-center justify-center w-20 h-20">
                      <img src="/logo/CHULA_ENG.png" alt="โรงเรียนจุฬาภรณราชวิทยาลัย" width={100} height={100} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">ปริญญาโท</h5>
                      <p className="text-gray-700 leading-relaxed">คณะวิศวกรรมศาสตร์</p>
                      <p className="text-sm text-gray-600 mt-1">จุฬาลงกรณ์มหาวิทยาลัย(กำลังศึกษา)</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-white rounded-lg p-2 shadow-sm flex items-center justify-center w-20 h-20">
                      <img src="/logo/มสท.png" alt="โรงเรียนจุฬาภรณราชวิทยาลัย" width={100} height={100} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 mb-1">ปริญญาโท</h5>
                      <p className="text-gray-700 leading-relaxed">
                        คณะครุศาสตร์
                        <br className="block md:hidden" />
                        <span className="hidden md:inline"> (จิตวิทยาการให้คำปรึกษา)</span>
                        <span className="block md:hidden">(จิตวิทยาการให้คำปรึกษา)</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">มหาวิทยาลัยสุโขทัยธรรมาธิราช (กำลังศึกษา)  </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
