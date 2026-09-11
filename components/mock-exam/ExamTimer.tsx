"use client"

import { Clock } from "lucide-react"

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
 * Large, always-visible exam clock. Deliberately NOT `fixed` — the page has a
 * fixed top navbar (see SiteMain's pt-16/pt-20), and a fixed-positioned badge
 * at top-4 landed underneath/behind it, which is what made the old timer read
 * as "hiding in a tiny corner". `sticky` with a top offset past the navbar
 * keeps it in view while scrolling without that overlap.
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
    <div
      className={`sticky top-20 z-40 mb-4 flex items-center justify-center gap-3 rounded-2xl border-2 px-6 py-3 shadow-md lg:top-24 ${
        warning ? "border-red-300 bg-red-50" : "border-[#004B7D]/20 bg-white"
      }`}
    >
      <Clock className={`h-7 w-7 shrink-0 ${warning ? "text-red-600" : "text-[#004B7D]"}`} />
      <div className="text-center leading-none">
        <div className={`text-3xl font-bold tabular-nums sm:text-4xl ${warning ? "text-red-700" : "text-[#004B7D]"}`}>
          {formatDuration(seconds)}
        </div>
        <div className={`mt-1 text-xs font-medium ${warning ? "text-red-600" : "text-muted-foreground"}`}>{label}</div>
      </div>
    </div>
  )
}
