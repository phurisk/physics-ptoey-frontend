/**
 * Standardized "แสดง X จาก Y รายการ" text for filter bars.
 */
export default function ResultsCount({
  current,
  total,
  itemLabel = "รายการ",
  className,
}: {
  current?: number
  total?: number
  itemLabel?: string
  className?: string
}) {
  return (
    <span className={`text-sm text-gray-500 ${className || ""}`}>
      แสดง {current ?? 0} จาก {total ?? 0} {itemLabel}
    </span>
  )
}
