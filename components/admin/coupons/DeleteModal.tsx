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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AdminCoupon } from "@/hooks/admin/useCoupons"

export default function DeleteModal({
  open,
  coupon,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  coupon: AdminCoupon | null
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!coupon) return null

  const usedCount = coupon.usedCount ?? coupon.usageCount ?? 0
  const hasUsage = usedCount > 0

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            ยืนยันการลบคูปอง
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">คุณต้องการลบคูปองนี้หรือไม่?</p>

          <div className="space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">รหัสคูปอง: </span>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {coupon.code}
              </Badge>
            </div>
            <div>
              <span className="font-medium text-gray-700">ชื่อ: </span>
              {coupon.name}
            </div>
            <div>
              <span className="font-medium text-gray-700">จำนวนการใช้งาน: </span>
              {usedCount} ครั้ง
            </div>
          </div>

          {hasUsage ? (
            <div className="flex items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>ไม่สามารถลบคูปองที่มีการใช้งานแล้วได้</span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>การลบจะไม่สามารถกู้คืนได้ กรุณายืนยันอีกครั้ง</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={loading || hasUsage}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              "ลบคูปอง"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
