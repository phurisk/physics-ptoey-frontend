"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">โปรไฟล์</h1>
        <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
      </div>
    )
  }

  const name = (user as any)?.name || (user as any)?.displayName || "ผู้ใช้"
  const email = (user as any)?.email || ""

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์</h1>
      <div className="bg-white border rounded-lg p-6 space-y-2">
        <div className="text-lg font-medium">{name}</div>
        {email && <div className="text-gray-600">{email}</div>}
      </div>
      <div className="mt-6">
        <Button onClick={() => logout()} variant="outline">
          ออกจากระบบ
        </Button>
      </div>
    </div>
  )
}

