"use client"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { AdminUser } from "@/hooks/admin/useUsers"

export default function DeleteModal({
  open,
  user,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  user: AdminUser | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการลบผู้ใช้งาน
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-2">
          <p className="text-sm text-gray-700">คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?</p>
          <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-semibold">ชื่อ: </span>
              {user.name || "-"}
            </div>
            <div>
              <span className="font-semibold">อีเมล: </span>
              {user.email || "-"}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            การดำเนินการนี้ไม่สามารถยกเลิกได้ หากผู้ใช้มีคำสั่งซื้อหรือการลงทะเบียนเรียนอยู่ ระบบจะไม่อนุญาตให้ลบ
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              "ลบผู้ใช้งาน"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
