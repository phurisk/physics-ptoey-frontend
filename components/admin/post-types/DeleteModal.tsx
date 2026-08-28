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
import type { AdminPostType } from "@/hooks/admin/usePostTypes"

export default function DeleteModal({
  open,
  postType,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  postType: AdminPostType | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!postType) return null

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการลบประเภทบทความ
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-2">
          <p className="text-sm text-gray-700">คุณแน่ใจหรือไม่ที่จะลบประเภทบทความนี้?</p>
          <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-semibold">ชื่อประเภท: </span>
              {postType.name}
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
                กำลังลบ...
              </>
            ) : (
              "ลบประเภทบทความ"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
