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
import type { AdminMockExam } from "@/hooks/admin/useMockExams"

export default function DeleteModal({
  open,
  exam,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  exam: AdminMockExam | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!exam) return null

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการลบข้อสอบจำลอง
          </AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-gray-700">
          คุณแน่ใจหรือไม่ที่จะลบ &quot;{exam.title}&quot;? คำถามทั้งหมด ({exam._count?.questions ?? 0} ข้อ) จะถูกลบไปด้วย
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            ลบ
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
