import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import { getSubjectOptions, getGradeLevelOptions } from "@/lib/constants"

const SUBJECT_OPTIONS = [{ value: "all", label: "ทุกวิชา" }, ...getSubjectOptions()]
const GRADE_OPTIONS = [{ value: "all", label: "ทุกระดับชั้น" }, ...getGradeLevelOptions()]
const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: "เปิดใช้งาน" },
  { value: "inactive", label: "ปิดใช้งาน" },
]

export default function DeckFilters({
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
      searchPlaceholder="ค้นหาชื่อชุดแฟลชการ์ด..."
      selects={[
        { key: "subject", value: filters.subject, onChange: (v) => onFilterChange("subject", v), placeholder: "วิชา", options: SUBJECT_OPTIONS },
        { key: "gradeLevel", value: filters.gradeLevel, onChange: (v) => onFilterChange("gradeLevel", v), placeholder: "ระดับชั้น", options: GRADE_OPTIONS },
        { key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), placeholder: "สถานะ", options: STATUS_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[filters.search && `ค้นหา: "${filters.search}"`]}
    />
  )
}
