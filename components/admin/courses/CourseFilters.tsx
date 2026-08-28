import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import PriceRangeFilter from "@/components/admin/shared/PriceRangeFilter"
import { getSubjectOptions, getGradeLevelOptions, getSubjectLabel, getGradeLevelLabel } from "@/lib/constants"

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "ACTIVE", label: "ใช้งานอยู่" },
  { value: "DRAFT", label: "ฉบับร่าง" },
  { value: "PUBLISHED", label: "เผยแพร่" },
  { value: "CLOSED", label: "ปิด" },
  { value: "DELETED", label: "ถูกลบ" },
]

export default function CourseFilters({
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onReset,
  instructors,
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
  instructors: { id: string; name: string; email: string }[]
  categories: { id: string; name: string }[]
  totalCount: number
  currentCount: number
  loading: boolean
}) {
  const instructorOptions = [{ value: "all", label: "ทั้งหมด" }, ...instructors.map((i) => ({ value: i.id, label: i.name }))]
  const categoryOptions = [{ value: "all", label: "ทั้งหมด" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]
  const subjectOptions = [{ value: "all", label: "ทั้งหมด" }, ...getSubjectOptions()]
  const gradeLevelOptions = [{ value: "all", label: "ทั้งหมด" }, ...getGradeLevelOptions()]

  return (
    <AdminFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหาชื่อคอร์สหรือรายละเอียด..."
      selects={[
        { key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), placeholder: "สถานะ", options: STATUS_OPTIONS },
        { key: "instructorId", value: filters.instructorId, onChange: (v) => onFilterChange("instructorId", v), placeholder: "ผู้สอน", options: instructorOptions },
        { key: "categoryId", value: filters.categoryId, onChange: (v) => onFilterChange("categoryId", v), placeholder: "หมวดหมู่", options: categoryOptions },
        { key: "subject", value: filters.subject, onChange: (v) => onFilterChange("subject", v), placeholder: "วิชา", options: subjectOptions },
        { key: "gradeLevel", value: filters.gradeLevel, onChange: (v) => onFilterChange("gradeLevel", v), placeholder: "ระดับชั้น", options: gradeLevelOptions },
      ]}
      extraFields={[
        {
          key: "priceRange",
          label: "ช่วงราคา",
          span: 2,
          render: () => (
            <PriceRangeFilter
              minValue={filters.minPrice}
              maxValue={filters.maxPrice}
              onCommit={(lo, hi) => {
                onFilterChange("minPrice", lo)
                onFilterChange("maxPrice", hi)
              }}
            />
          ),
        },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.status !== "ALL" && `สถานะ: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}`,
        filters.instructorId !== "all" && `ผู้สอน: ${instructors.find((i) => i.id === filters.instructorId)?.name || filters.instructorId}`,
        filters.categoryId !== "all" && `หมวดหมู่: ${categories.find((c) => c.id === filters.categoryId)?.name || filters.categoryId}`,
        filters.subject !== "all" && `วิชา: ${getSubjectLabel(filters.subject)}`,
        filters.gradeLevel !== "all" && `ระดับชั้น: ${getGradeLevelLabel(filters.gradeLevel)}`,
        (filters.minPrice || filters.maxPrice) && `ราคา: ฿${filters.minPrice || 0} - ${filters.maxPrice ? `฿${filters.maxPrice}` : "ไม่จำกัด"}`,
      ]}
    />
  )
}
