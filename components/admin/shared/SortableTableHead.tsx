import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"

/**
 * A <TableHead> whose label is a button that toggles server-side sort on
 * click — active column shows an up/down arrow, inactive columns show a
 * faint neutral arrow as an affordance.
 */
export default function SortableTableHead({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  field: string
  label: string
  sortBy: string
  sortOrder: string
  onSort: (field: string) => void
  className?: string
}) {
  const isActive = sortBy === field
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
      >
        {label}
        {isActive ? (
          sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-gray-300" />
        )}
      </button>
    </TableHead>
  )
}
