import { Input } from "@/components/ui/input"
import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอชำระเงิน" },
  { value: "PENDING_PAYMENT", label: "รอชำระเงิน (รอสลิป)" },
  { value: "PENDING_VERIFICATION", label: "รอตรวจสอบ" },
  { value: "COMPLETED", label: "สำเร็จ" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "REFUNDED", label: "คืนเงิน" },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอชำระ" },
  { value: "PENDING_VERIFICATION", label: "รอตรวจสอบ" },
  { value: "COMPLETED", label: "ชำระแล้ว" },
  { value: "REJECTED", label: "ปฏิเสธ" },
  { value: "FAILED", label: "ล้มเหลว" },
  { value: "REFUNDED", label: "คืนเงิน" },
]

export default function OrderFilters({
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
      searchPlaceholder="ค้นหาเลขคำสั่งซื้อ, ชื่อ หรืออีเมลลูกค้า..."
      selects={[
        { key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), placeholder: "สถานะคำสั่งซื้อ", options: STATUS_OPTIONS },
        { key: "paymentStatus", value: filters.paymentStatus, onChange: (v) => onFilterChange("paymentStatus", v), placeholder: "สถานะการชำระเงิน", options: PAYMENT_STATUS_OPTIONS },
      ]}
      extraFields={[
        {
          key: "dateRange",
          label: "ช่วงวันที่",
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
        filters.status !== "ALL" && `สถานะ: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}`,
        filters.paymentStatus !== "ALL" &&
          `การชำระเงิน: ${PAYMENT_STATUS_OPTIONS.find((o) => o.value === filters.paymentStatus)?.label || filters.paymentStatus}`,
        (filters.dateFrom || filters.dateTo) && `วันที่: ${filters.dateFrom || "..."} - ${filters.dateTo || "..."}`,
      ]}
    />
  )
}
