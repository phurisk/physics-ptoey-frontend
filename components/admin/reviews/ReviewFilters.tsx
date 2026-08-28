import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const RATING_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "5", label: "5 ดาว" },
  { value: "4", label: "4 ดาว" },
  { value: "3", label: "3 ดาว" },
  { value: "2", label: "2 ดาว" },
  { value: "1", label: "1 ดาว" },
]

const TARGET_TYPE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "course", label: "คอร์สเรียน" },
  { value: "ebook", label: "อีบุ๊ก" },
]

const VERIFIED_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "true", label: "ผู้ซื้อจริง" },
  { value: "false", label: "ยังไม่ยืนยัน" },
]

export default function ReviewFilters({
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
      searchPlaceholder="ค้นหาความเห็น, หัวข้อ, หรือชื่อผู้ใช้..."
      selects={[
        { key: "rating", value: filters.rating, onChange: (v) => onFilterChange("rating", v), placeholder: "คะแนน", options: RATING_OPTIONS },
        { key: "targetType", value: filters.targetType, onChange: (v) => onFilterChange("targetType", v), placeholder: "ประเภท", options: TARGET_TYPE_OPTIONS },
        { key: "isVerified", value: filters.isVerified, onChange: (v) => onFilterChange("isVerified", v), placeholder: "สถานะการซื้อ", options: VERIFIED_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.rating !== "all" && `คะแนน: ${RATING_OPTIONS.find((o) => o.value === filters.rating)?.label || filters.rating}`,
        filters.targetType !== "all" && `ประเภท: ${TARGET_TYPE_OPTIONS.find((o) => o.value === filters.targetType)?.label || filters.targetType}`,
        filters.isVerified !== "all" && `สถานะการซื้อ: ${VERIFIED_OPTIONS.find((o) => o.value === filters.isVerified)?.label || filters.isVerified}`,
      ]}
    />
  )
}
