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
import type { AdminFlashcardDeck } from "@/hooks/admin/useFlashcardDecks"

export default function DeleteModal({
  open,
  deck,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  deck: AdminFlashcardDeck | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!deck) return null

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการลบชุดแฟลชการ์ด
          </AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-gray-700">
          คุณแน่ใจหรือไม่ที่จะลบ &quot;{deck.title}&quot;? การ์ดทั้งหมด ({deck._count?.cards ?? 0} ใบ) จะถูกลบไปด้วย
        </p>
        <p className="text-xs text-amber-600">หากมีนักเรียนทบทวนการ์ดในชุดนี้แล้ว ระบบจะบล็อกการลบ — กรุณาปิดใช้งานแทน</p>
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
