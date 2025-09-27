"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Receipt, Book, Loader2 } from "lucide-react"
import LoginModal from "@/components/login-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export default function ProfilePage() {
  const { user, isAuthenticated, logout, loading } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const name = (user as any)?.name || (user as any)?.displayName || "ผู้ใช้"
  const email = (user as any)?.email || ""
  const avatarUrl = (user as any)?.image || (user as any)?.avatarUrl || (user as any)?.picture || (user as any)?.profileImageUrl || null
  const initial = String(name || "").trim().charAt(0).toUpperCase() || "U"

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">โปรไฟล์</h1>
        {loading && !isAuthenticated ? (
          <div className="flex items-center gap-3 bg-white border rounded-lg p-6 text-gray-700">
            <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
            <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border rounded-lg p-6">
            <p className="text-gray-700">กรุณาเข้าสู่ระบบเพื่อจัดการโปรไฟล์และการสั่งซื้อ</p>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setLoginOpen(true)}>เข้าสู่ระบบ</Button>
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-6 flex items-center gap-4">
            <Avatar>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={name} />
              ) : (
                <AvatarFallback className="bg-yellow-500 text-white">{initial}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="text-lg font-medium ">{name}</div>
              {email && <div className="text-gray-600 md:text-sm text-xs truncate md:max-w-full max-w-[230px] ">{email}</div>}

              <Button className="mt-2 text-xs"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(email || "")}
              >
                คัดลอกอีเมล
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/profile/my-courses">
          <Card className="group cursor-pointer hover:shadow-lg transition-shadow pt-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-gray-900 group-hover:text-yellow-700">คอร์สของฉัน</div>
                <div className="text-sm text-gray-600 truncate">ดูและเข้าเรียนคอร์สที่คุณซื้อไว้</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/my-books">
          <Card className="group cursor-pointer hover:shadow-lg transition-shadow pt-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                <Book className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-gray-900 group-hover:text-yellow-700">หนังสือของฉัน</div>
                <div className="text-sm text-gray-600 truncate">ดูและอ่าน/ดาวน์โหลด eBook ที่ซื้อไว้</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/orders">
          <Card className="group cursor-pointer hover:shadow-lg transition-shadow pt-0">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-gray-900 group-hover:text-yellow-700">คำสั่งซื้อของฉัน</div>
                <div className="text-sm text-gray-600 truncate">ตรวจสถานะและอัพโหลดอัปสลิปชำระเงิน</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {isAuthenticated ? (
        <div className="pt-2">
          <Button onClick={() => logout()} variant="outline">ออกจากระบบ</Button>
        </div>
      ) : (
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      )}
    </div>
  )
}
