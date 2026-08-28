import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminAccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500" />
      <div>
        <h1 className="text-xl font-semibold text-gray-900">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-1 text-sm text-gray-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ</p>
      </div>
      <Button asChild>
        <Link href="/">กลับสู่หน้าหลัก</Link>
      </Button>
    </div>
  )
}
