import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "ACTIVE", label: "กำลังเรียน" },
  { value: "COMPLETED", label: "เรียนจบแล้ว" },
  { value: "CANCELED", label: "ยกเลิก" },
]

export default function EnrollmentFilters({
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
      searchPlaceholder="ค้นหาชื่อ, อีเมลผู้เรียน หรือชื่อคอร์ส..."
      selects={[
        { key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), placeholder: "สถานะ", options: STATUS_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.status !== "ALL" && `สถานะ: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}`,
      ]}
    />
  )
}
