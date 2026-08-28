"use client"
import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"

const formatBaht = (n: number) => new Intl.NumberFormat("th-TH").format(n)

/**
 * Dual-thumb price range slider for filter bars. Drags update a local
 * preview only — the actual filter (and refetch) commits on release via
 * Radix's onValueCommit, so dragging doesn't spam requests.
 */
export default function PriceRangeFilter({
  min = 0,
  max = 10000,
  step = 100,
  minValue,
  maxValue,
  onCommit,
}: {
  min?: number
  max?: number
  step?: number
  minValue: unknown
  maxValue: unknown
  onCommit: (lo: string, hi: string) => void
}) {
  const resolved: [number, number] = [
    minValue === "" || minValue == null ? min : Number(minValue),
    maxValue === "" || maxValue == null ? max : Number(maxValue),
  ]
  const [local, setLocal] = useState<[number, number]>(resolved)

  useEffect(() => {
    setLocal(resolved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minValue, maxValue])

  return (
    <div className="pt-1.5">
      <div className="mb-2 flex justify-between text-xs text-gray-500">
        <span>฿{formatBaht(local[0])}</span>
        <span>{local[1] >= max ? `฿${formatBaht(max)}+` : `฿${formatBaht(local[1])}`}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={local}
        onValueChange={(v) => setLocal(v as [number, number])}
        onValueCommit={([lo, hi]) => {
          onCommit(lo <= min ? "" : String(lo), hi >= max ? "" : String(hi))
        }}
      />
    </div>
  )
}
