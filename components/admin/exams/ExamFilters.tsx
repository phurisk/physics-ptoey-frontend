import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import { getExamTypeOptions, getExamTypeLabel } from "@/lib/constants"
import type { AdminExamCourseOption } from "@/hooks/admin/useExams"

const ACTIVE_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "true", label: "เปิดใช้งาน" },
  { value: "false", label: "ปิดใช้งาน" },
]

export default function ExamFilters({
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onReset,
  courses,
  totalCount,
  currentCount,
  loading,
}: {
  filters: Record<string, any>
  searchInput: string
  setSearchInput: (v: string) => void
  onFilterChange: (key: string, value: unknown) => void
  onReset: () => void
  courses: AdminExamCourseOption[]
  totalCount: number
  currentCount: number
  loading: boolean
}) {
  const courseOptions = [{ value: "all", label: "ทั้งหมด" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]
  const examTypeOptions = [{ value: "all", label: "ทั้งหมด" }, ...getExamTypeOptions()]

  return (
    <AdminFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหาชื่อข้อสอบหรือรายละเอียด..."
      selects={[
        { key: "courseId", value: filters.courseId, onChange: (v) => onFilterChange("courseId", v), placeholder: "คอร์ส", options: courseOptions },
        { key: "examType", value: filters.examType, onChange: (v) => onFilterChange("examType", v), placeholder: "ประเภทข้อสอบ", options: examTypeOptions },
        { key: "isActive", value: filters.isActive, onChange: (v) => onFilterChange("isActive", v), placeholder: "สถานะ", options: ACTIVE_OPTIONS },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.courseId !== "all" && `คอร์ส: ${courses.find((c) => c.id === filters.courseId)?.title || filters.courseId}`,
        filters.examType !== "all" && `ประเภท: ${getExamTypeLabel(filters.examType)}`,
        filters.isActive !== "all" && `สถานะ: ${ACTIVE_OPTIONS.find((o) => o.value === filters.isActive)?.label || filters.isActive}`,
      ]}
    />
  )
}
