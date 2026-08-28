import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import { Input } from "@/components/ui/input"

const ACTIVE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "true", label: "เปิดใช้งาน" },
  { value: "false", label: "ปิดใช้งาน" },
]

export default function PostFilters({
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onReset,
  postTypes,
  totalCount,
  currentCount,
  loading,
}: {
  filters: Record<string, any>
  searchInput: string
  setSearchInput: (v: string) => void
  onFilterChange: (key: string, value: unknown) => void
  onReset: () => void
  postTypes: { id: string; name: string }[]
  totalCount: number
  currentCount: number
  loading: boolean
}) {
  const postTypeOptions = [{ value: "all", label: "ทั้งหมด" }, ...postTypes.map((t) => ({ value: t.id, label: t.name }))]

  return (
    <AdminFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหาชื่อบทความ, เนื้อหา หรือคำโปรย..."
      selects={[
        { key: "postTypeId", value: filters.postTypeId, onChange: (v) => onFilterChange("postTypeId", v), placeholder: "ประเภทบทความ", options: postTypeOptions },
        { key: "isActive", value: filters.isActive, onChange: (v) => onFilterChange("isActive", v), placeholder: "สถานะ", options: ACTIVE_OPTIONS },
      ]}
      extraFields={[
        {
          key: "dateRange",
          label: "ช่วงวันที่สร้าง",
          span: 2,
          render: () => (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={(filters.dateFrom as string) || ""}
                onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                className="flex-1"
              />
              <span className="shrink-0 text-sm text-gray-400">ถึง</span>
              <Input
                type="date"
                value={(filters.dateTo as string) || ""}
                onChange={(e) => onFilterChange("dateTo", e.target.value)}
                className="flex-1"
              />
            </div>
          ),
        },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.postTypeId !== "all" && `ประเภท: ${postTypes.find((t) => t.id === filters.postTypeId)?.name || filters.postTypeId}`,
        filters.isActive !== "all" && `สถานะ: ${ACTIVE_OPTIONS.find((o) => o.value === filters.isActive)?.label || filters.isActive}`,
        (filters.dateFrom || filters.dateTo) && `วันที่: ${filters.dateFrom || "..."} - ${filters.dateTo || "..."}`,
      ]}
    />
  )
}
