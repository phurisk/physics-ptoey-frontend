"use client"

import { useState } from "react"
import MyCourses from "@/components/profile/my-courses"
import { useAuth } from "@/components/auth-provider"
import LoginModal from "@/components/login-modal"
import { Button } from "@/components/ui/button"

export default function MyCoursesPage() {
  const { isAuthenticated } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">คอร์สของฉัน</h1>
        <p className="text-gray-600">ดูคอร์สที่คุณซื้อและเริ่มเรียนได้ทันที</p>
      </div>
      {!isAuthenticated ? (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-gray-700">กรุณาเข้าสู่ระบบเพื่อดูคอร์สของคุณ</div>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setLoginOpen(true)}>เข้าสู่ระบบ</Button>
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      ) : (
        <MyCourses />
      )}
    </div>
  )
}

