import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"
import { getQuestionTypeOptions } from "@/lib/constants"
import type { AdminMockTopic } from "@/hooks/admin/useMockTopics"

const TYPE_OPTIONS = [{ value: "all", label: "ทุกประเภท" }, ...getQuestionTypeOptions()]

export default function MockQuestionFilters({
  filters,
  searchInput,
  setSearchInput,
  onFilterChange,
  onReset,
  totalCount,
  currentCount,
  loading,
  topics,
}: {
  filters: Record<string, any>
  searchInput: string
  setSearchInput: (v: string) => void
  onFilterChange: (key: string, value: unknown) => void
  onReset: () => void
  totalCount: number
  currentCount: number
  loading: boolean
  topics: AdminMockTopic[]
}) {
  const topicOptions = [{ value: "all", label: "ทุกหัวข้อ" }, ...topics.map((t) => ({ value: t.id, label: t.name }))]

  return (
    <AdminFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="ค้นหาคำถามหรือคำอธิบาย..."
      selects={[
        { key: "questionType", value: filters.questionType, onChange: (v) => onFilterChange("questionType", v), placeholder: "ประเภทคำถาม", options: TYPE_OPTIONS },
        { key: "topicId", value: filters.topicId, onChange: (v) => onFilterChange("topicId", v), placeholder: "หัวข้อ", options: topicOptions },
      ]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.questionType !== "all" && `ประเภท: ${TYPE_OPTIONS.find((o) => o.value === filters.questionType)?.label || filters.questionType}`,
        filters.topicId !== "all" && `หัวข้อ: ${topicOptions.find((o) => o.value === filters.topicId)?.label || filters.topicId}`,
      ]}
    />
  )
}
