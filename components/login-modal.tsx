"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { SiLine } from "react-icons/si"
import { useAuth } from "@/components/auth-provider"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { loginWithLine } = useAuth()

  const handleLineLogin = async () => {
    if (loading) return
    setError("")
    setLoading(true)
    try {
      await loginWithLine() // มักจะ redirect ออกไป LINE OAuth
    } catch {
      setError("ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองอีกครั้ง")
      setLoading(false)
    } finally {
      // เผื่อกรณีไม่มี redirect จริง ๆ ให้ปลด loading เอง
      setTimeout(() => setLoading(false), 8000)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="
          sm:max-w-[420px]
          rounded-xl
          border border-gray-200
          bg-white
          shadow-lg
          p-0 overflow-hidden
        "
      >
        <DialogDescription className="sr-only">
          กล่องโต้ตอบเข้าสู่ระบบด้วย LINE
        </DialogDescription>

        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-xl font-semibold text-gray-900 w-fit mx-auto">
            เข้าสู่ระบบ
          </DialogTitle>

          <p className="mt-1 text-sm text-gray-500">
            ใช้ LINE เพื่อเข้าสู่ระบบและซิงก์ความคืบหน้าทุกอุปกรณ์
          </p>
        </DialogHeader>


        <div className="px-6">
          <ul className="mx-auto mt-1 grid grid-cols-1 gap-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              บันทึกความคืบหน้าการเรียนอัตโนมัติ
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              ปลดล็อกแบบฝึกหัดและข้อสอบทั้งหมด
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              ซิงก์ได้ทุกอุปกรณ์
            </li>
          </ul>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleLineLogin}
            disabled={loading}
            className="
              w-full py-3 rounded-lg
              bg-[#06C755] hover:bg-[#05b84f]
              text-white font-medium
              shadow-sm transition-all
              flex items-center justify-center gap-3
              cursor-pointer
            "
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SiLine className="h-6 w-6" />
            )}
            เข้าสู่ระบบด้วย LINE
          </Button>

          <p className="pt-1 text-center text-xs text-gray-400">
            โดยการใช้งาน คุณยอมรับ{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-gray-600">
              ข้อกำหนดการใช้งาน
            </a>{" "}
            และ{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-gray-600">
              นโยบายความเป็นส่วนตัว
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
