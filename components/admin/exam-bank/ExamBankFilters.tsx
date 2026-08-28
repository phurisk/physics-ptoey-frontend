import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const ACTIVE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "true", label: "เปิดใช้งาน" },
  { value: "false", label: "ปิดใช้งาน" },
]

export default function ExamBankFilters({
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onReset,
  categories,
  totalCount,
  currentCount,
  loading,
}: {
  filters: Record<string, any>
  searchInput: string
  setSearchInput: (v: string) => void
  onFilterChange: (key: string, value: unknown) => void
  onReset: () => void
  categories: { id: string; name: string }[]
  totalCount: number
  currentCount: number
  loading: boolean
}) {
  const categoryOptions = [{ value: "all", label: "ทั้งหมด" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]

  return (
    <AdminFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหาชื่อข้อสอบหรือรายละเอียด..."
      selects={[
        { key: "categoryId", value: filters.categoryId, onChange: (v) => onFilterChange("categoryId", v), placeholder: "หมวดหมู่", options: categoryOptions },
        { key: "isActive", value: filters.isActive, onChange: (v) => onFilterChange("isActive", v), placeholder: "สถานะ", options: ACTIVE_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.categoryId !== "all" && `หมวดหมู่: ${categories.find((c) => c.id === filters.categoryId)?.name || filters.categoryId}`,
        filters.isActive !== "all" && `สถานะ: ${ACTIVE_OPTIONS.find((o) => o.value === filters.isActive)?.label || filters.isActive}`,
      ]}
    />
  )
}
