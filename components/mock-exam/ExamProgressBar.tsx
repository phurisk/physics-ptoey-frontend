"use client"

import { Progress } from "@/components/ui/progress"

export default function ExamProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>ความคืบหน้า</span>
        <span>
          ตอบแล้ว {answered}/{total} ข้อ
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  )
}
