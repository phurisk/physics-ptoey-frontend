import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import PriceRangeFilter from "@/components/admin/shared/PriceRangeFilter"

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "ACTIVE", label: "เปิดใช้งาน" },
  { value: "INACTIVE", label: "ปิดใช้งาน" },
]

const FORMAT_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "PDF", label: "PDF" },
  { value: "EPUB", label: "EPUB" },
  { value: "MOBI", label: "MOBI" },
]

const FEATURED_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "FEATURED", label: "แนะนำ" },
  { value: "NOT_FEATURED", label: "ไม่แนะนำ" },
]

const PHYSICAL_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DIGITAL", label: "ดิจิทัล" },
  { value: "PHYSICAL", label: "กายภาพ" },
]

export default function EbookFilters({
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
      searchPlaceholder="ค้นหาชื่อหนังสือ ผู้เขียน หรือ ISBN..."
      selects={[
        { key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), placeholder: "สถานะ", options: STATUS_OPTIONS },
        { key: "categoryId", value: filters.categoryId, onChange: (v) => onFilterChange("categoryId", v), placeholder: "หมวดหมู่", options: categoryOptions },
        { key: "format", value: filters.format, onChange: (v) => onFilterChange("format", v), placeholder: "รูปแบบ", options: FORMAT_OPTIONS },
        { key: "featured", value: filters.featured, onChange: (v) => onFilterChange("featured", v), placeholder: "แนะนำ", options: FEATURED_OPTIONS },
        { key: "physical", value: filters.physical, onChange: (v) => onFilterChange("physical", v), placeholder: "ประเภท", options: PHYSICAL_OPTIONS },
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
        filters.categoryId !== "all" && `หมวดหมู่: ${categories.find((c) => c.id === filters.categoryId)?.name || filters.categoryId}`,
        filters.format !== "all" && `รูปแบบ: ${filters.format}`,
        filters.featured !== "ALL" && `แนะนำ: ${FEATURED_OPTIONS.find((o) => o.value === filters.featured)?.label || filters.featured}`,
        filters.physical !== "ALL" && `ประเภท: ${PHYSICAL_OPTIONS.find((o) => o.value === filters.physical)?.label || filters.physical}`,
        (filters.minPrice || filters.maxPrice) && `ราคา: ฿${filters.minPrice || 0} - ${filters.maxPrice ? `฿${filters.maxPrice}` : "ไม่จำกัด"}`,
      ]}
    />
  )
}
