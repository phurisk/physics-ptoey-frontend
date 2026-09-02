"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

/**
 * Scratch pad backed by tldraw, used in place of the hand-rolled AnswerPad.
 * (AnswerPad and its FreehandEngine are still in the tree — the PDF exam
 * overlay uses them, and they remain the fallback if this is rolled back.)
 *
 * tldraw is a large client-only bundle, so it is split out and loaded on
 * demand rather than shipped with the rest of the attempt page.
 */
const TldrawCanvas = dynamic(() => import("./TldrawCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      กำลังเตรียมกระดาษร่าง...
    </div>
  ),
})

export default function TldrawPad() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b bg-gray-50 px-2.5 py-2">
        <div>
          <span className="text-sm font-semibold text-gray-900">กระดาษร่าง</span>
          <p className="text-xs text-gray-500">พื้นที่คิดเลข/ร่างคำตอบ (ไม่ถูกบันทึก)</p>
        </div>
      </div>
      {/* tldraw's root is `width/height: 100%`, and a percentage height does not
          resolve against a flex-grown box — it collapses to zero and the canvas
          renders blank. The absolutely-positioned inner div gives it a real
          height to fill. */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <TldrawCanvas />
        </div>
      </div>
    </div>
  )
}
