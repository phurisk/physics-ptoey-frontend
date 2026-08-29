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
import { getQuestionTypeLabel } from "@/lib/constants"
import type { AdminMockQuestion } from "@/hooks/admin/useMockExamQuestions"

export default function DeleteModal({
  open,
  question,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  question: AdminMockQuestion | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!question) return null

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการลบคำถาม
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-2">
          <p className="text-sm text-gray-700">คุณแน่ใจหรือไม่ที่จะลบคำถามนี้?</p>

          <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
            <p className="line-clamp-3 font-semibold">{question.questionText}</p>
            <div className="mt-1 text-gray-500">
              ประเภท: {getQuestionTypeLabel(question.questionType)} • คะแนน: {question.marks}
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            คำถามและตัวเลือกทั้งหมดจะถูกลบอย่างถาวร
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
              "ลบคำถาม"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
