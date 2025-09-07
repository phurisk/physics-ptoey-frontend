"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { externalAuth } from "@/lib/external-auth"
import { useAuth } from "@/components/auth-provider"

export default function LineCallbackPage() {
  const router = useRouter()
  const { updateUser } = useAuth()
  const [message, setMessage] = useState("กำลังเข้าสู่ระบบด้วย LINE...")

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        const state = params.get("state")
        if (!code) {
          setMessage("ไม่พบโค้ดยืนยันจาก LINE")
          setTimeout(() => router.replace("/"), 1200)
          return
        }
        const result = await externalAuth.handleLineCallback(code, state)
        if (result?.user) updateUser(result.user)
        const target = result?.returnUrl || "/"
        router.replace(target)
      } catch (err) {
        console.error(err)
        setMessage("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
        setTimeout(() => router.replace("/"), 1500)
      }
    }
    run()
  }, [router, updateUser])

  return (
    <div className="w-full h-[60vh] flex items-center justify-center">
      <p className="text-gray-700 text-sm">{message}</p>
    </div>
  )
}
