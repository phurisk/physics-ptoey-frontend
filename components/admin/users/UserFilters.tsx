import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const ROLE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "STUDENT", label: "นักเรียน" },
  { value: "INSTRUCTOR", label: "ผู้สอน" },
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
]

export default function UserFilters({
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
      searchPlaceholder="ค้นหาชื่อ, อีเมล, หรือ Line ID..."
      selects={[
        { key: "role", value: filters.role, onChange: (v) => onFilterChange("role", v), placeholder: "บทบาท", options: ROLE_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.role !== "all" && `บทบาท: ${ROLE_OPTIONS.find((o) => o.value === filters.role)?.label || filters.role}`,
      ]}
    />
  )
}
