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
import type { AdminEnrollment } from "@/hooks/admin/useEnrollments"

export default function DeleteModal({
  open,
  enrollment,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enrollment: AdminEnrollment | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!enrollment) return null

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการยกเลิกการลงทะเบียน
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-2">
          <p className="text-sm text-gray-700">คุณแน่ใจหรือไม่ที่จะยกเลิกการลงทะเบียนนี้? ผู้เรียนจะเสียสิทธิ์การเข้าถึงคอร์สทันที</p>
          <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-semibold">ผู้เรียน: </span>
              {enrollment.user?.name || enrollment.user?.email}
            </div>
            <div>
              <span className="font-semibold">คอร์ส: </span>
              {enrollment.course?.title}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            การดำเนินการนี้ไม่สามารถยกเลิกได้
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              "ยกเลิกการลงทะเบียน"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
