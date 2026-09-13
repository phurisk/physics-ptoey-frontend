"use client"

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function formatDuration(totalSeconds: number) {
  const total = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, "0")
  const ss = String(s).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * Compact exam clock, pinned to the top-right. Deliberately NOT `fixed` — the
 * page has a fixed top navbar (see SiteMain's pt-16/pt-20), and a
 * fixed-positioned badge at top-4 landed underneath/behind it. `sticky` with
 * a top offset past the navbar keeps it in view while scrolling without that
 * overlap, while `justify-end` keeps it a small corner badge instead of a
 * full-width bar.
 */
export default function ExamTimer({
  seconds,
  label,
  warning = false,
}: {
  seconds: number
  label: string
  warning?: boolean
}) {
  return (
    <div className="sticky top-20 z-40 mb-4 flex justify-end lg:top-24">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 shadow-md",
          warning ? "border-red-300 bg-red-50" : "border-[#004B7D]/20 bg-white"
        )}
      >
        <Clock className={cn("h-4 w-4 shrink-0", warning ? "text-red-600" : "text-[#004B7D]")} />
        <div className="text-right leading-none">
          <div className={cn("text-base font-bold tabular-nums", warning ? "text-red-700" : "text-[#004B7D]")}>
            {formatDuration(seconds)}
          </div>
          <div className={cn("mt-0.5 text-[10px] font-medium", warning ? "text-red-600" : "text-muted-foreground")}>{label}</div>
        </div>
      </div>
    </div>
  )
}
