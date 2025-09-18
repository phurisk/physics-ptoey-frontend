"use client"

import { useState } from "react"
import Orders from "@/components/profile/orders"
import { useAuth } from "@/components/auth-provider"
import LoginModal from "@/components/login-modal"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function OrdersPage() {
  const { isAuthenticated, loading } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">คำสั่งซื้อของฉัน</h1>
        <p className="text-gray-600">ตรวจสอบสถานะคำสั่งซื้อและอัพโหลดสลิปการชำระเงิน</p>
      </div>
      {loading && !isAuthenticated ? (
        <div className="bg-white border rounded-lg p-6 flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
          <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-gray-700">กรุณาเข้าสู่ระบบเพื่อดูคำสั่งซื้อของคุณ</div>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setLoginOpen(true)}>เข้าสู่ระบบ</Button>
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      ) : (
        <Orders />
      )}
    </div>
  )
}
