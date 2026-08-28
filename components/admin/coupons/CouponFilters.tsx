import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const TYPE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "PERCENTAGE", label: "ส่วนลด %" },
  { value: "FIXED_AMOUNT", label: "ส่วนลดจำนวนคงที่" },
  { value: "FREE_SHIPPING", label: "ฟรีค่าส่ง" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: "ใช้งานได้" },
  { value: "inactive", label: "ไม่ใช้งาน" },
]

const APPLICABLE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "ALL", label: "ทุกสินค้า" },
  { value: "COURSE_ONLY", label: "คอร์สเท่านั้น" },
  { value: "EBOOK_ONLY", label: "E-book เท่านั้น" },
  { value: "CATEGORY", label: "หมวดหมู่ที่กำหนด" },
  { value: "SPECIFIC_ITEM", label: "สินค้าที่กำหนด" },
]

export default function CouponFilters({
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
      searchLabel="ค้นหาคูปอง"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหารหัสคูปอง, ชื่อ หรือคำอธิบาย..."
      selects={[
        { key: "type", value: filters.type, onChange: (v) => onFilterChange("type", v), label: "ประเภทคูปอง", placeholder: "ประเภทคูปอง", options: TYPE_OPTIONS },
        { key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), label: "สถานะ", placeholder: "สถานะ", options: STATUS_OPTIONS },
        { key: "applicableType", value: filters.applicableType, onChange: (v) => onFilterChange("applicableType", v), label: "ขอบเขตการใช้งาน", placeholder: "ขอบเขตการใช้งาน", options: APPLICABLE_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.type !== "all" && `ประเภท: ${TYPE_OPTIONS.find((o) => o.value === filters.type)?.label || filters.type}`,
        filters.status !== "all" && `สถานะ: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}`,
        filters.applicableType !== "all" && `ขอบเขต: ${APPLICABLE_OPTIONS.find((o) => o.value === filters.applicableType)?.label || filters.applicableType}`,
      ]}
    />
  )
}
