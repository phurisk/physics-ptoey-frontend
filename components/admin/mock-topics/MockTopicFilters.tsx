import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import { getSubjectOptions } from "@/lib/constants"

const SUBJECT_OPTIONS = [{ value: "all", label: "ทุกวิชา" }, ...getSubjectOptions()]

export default function MockTopicFilters({
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onReset,
  totalCount,
  currentCount,
  loading,
}: {
  filters: Record<string, any>
  searchInput: string
  setSearchInput: (v: string) => void
  onFilterChange: (key: string, value: unknown) => void
  onReset: () => void
  totalCount: number
  currentCount: number
  loading: boolean
}) {
  return (
    <AdminFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหาชื่อหัวข้อ..."
      selects={[{ key: "subject", value: filters.subject, onChange: (v) => onFilterChange("subject", v), placeholder: "วิชา", options: SUBJECT_OPTIONS }]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.subject !== "all" && `วิชา: ${SUBJECT_OPTIONS.find((o) => o.value === filters.subject)?.label || filters.subject}`,
      ]}
    />
  )
}
