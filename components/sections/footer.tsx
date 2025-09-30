import Link from "next/link"
import { Mail, MapPin, Clock } from "lucide-react"
import { SiFacebook, SiInstagram, SiTiktok, SiLine } from "react-icons/si"

export function Footer() {
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <SiFacebook className="w-6 h-6" />
      case "instagram":
        return <SiInstagram className="w-6 h-6" />
      case "line":
        return <SiLine className="w-6 h-6" />
      case "tiktok":
        return (
          <SiTiktok className="w-6 h-6" />
        )
      default:
        return null
    }
  }


  const socialLinks = [
    { platform: "TikTok", username: "@physicsptoey", url: "https://tiktok.com/@physicsptoey" },
    { platform: "Instagram", username: "@physics.ptoey", url: "https://instagram.com/physics.ptoey" },
    { platform: "Facebook", username: "@physicsptoey", url: "https://facebook.com/physicsptoey" },
    { platform: "Line", username: "@physics.ptoey", url: "https://line.me/ti/p/@physics.ptoey" },
  ]

  const contactInfo = {
    email: "Physicsptoey@hotmail.com",
    schoolName: "โรงเรียนกวดวิชาฟิสิกส์อาจารย์เต้ย",
    subtitle: "(ในความควบคุมของกระทรวงศึกษาธิการ)",
    address: "สำนักงานใหญ่ : สาขาสุพรรณบุรี ถนนเณรแก้วข้างห้างนาซ่ามอลล์เก่า (ฝั่งวนรถเข้า)",
    hours: {
      vacation: "ปิดเทอม 8:00-18:00 ทุกวัน",
      semester: "เปิดเทอม จ-ศ 12:00-20:00 ส-อา 8:00-20:00",
    },
  }

  return (
    <footer className="bg-gray-900 text-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">

          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <img src="/new-logo.png" alt="Logo" className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-xl font-bold">ฟิสิกส์พี่เต้ย</h3>
                <p className="text-gray-400 text-sm">เรียนฟิสิกส์อย่างเป็นระบบกับฟิสิกส์พี่เต้ย</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              {contactInfo.schoolName} <br /> {contactInfo.subtitle} <br /> พร้อมให้บริการการเรียนการสอนฟิสิกส์ที่มีคุณภาพ
              เพื่อให้นักเรียนประสบความสำเร็จในการศึกษา
            </p>


            <div>
              <h4 className="text-lg font-semibold mb-4">ติดตามเราได้ที่</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <Link
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-yellow-400 rounded-lg flex items-center justify-center transition-colors duration-200 group"
                  >
                    <span className="group-hover:text-white">{getSocialIcon(social.platform)}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-400">
                {socialLinks.map((social) => (
                  <div key={social.platform}>
                    <span className="font-medium">{social.platform}:</span> {social.username}
                  </div>
                ))}
              </div>
            </div>
          </div>


          <div>
            <h4 className="text-lg font-semibold mb-6">ข้อมูลติดต่อ</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">อีเมล</p>
                  <p className="text-gray-300 text-sm">{contactInfo.email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">ที่อยู่</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{contactInfo.address}</p>
                </div>
              </div>
            </div>
          </div>


          <div>
            <h4 className="text-lg font-semibold mb-6">เวลาทำการ</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">ช่วงปิดเทอม</p>
                  <p className="text-gray-300 text-sm">{contactInfo.hours.vacation}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">ช่วงเปิดเทอม</p>
                  <p className="text-gray-300 text-sm">{contactInfo.hours.semester}</p>
                </div>
              </div>
            </div>


            <div className="mt-8">
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer hover:font-bold">
              <Link
    href="https://line.me/ti/p/@csw9917j"
    target="_blank"
    rel="noopener noreferrer"
  >
                ติดต่อเราเลย
                </Link>
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">Copyright © 2025 {contactInfo.schoolName} | All Rights Reserved</p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-yellow-400 transition-colors duration-200">
                นโยบายความเป็นส่วนตัว
              </Link>
              <Link href="/terms" className="hover:text-yellow-400 transition-colors duration-200">
                ข้อกำหนดการใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
