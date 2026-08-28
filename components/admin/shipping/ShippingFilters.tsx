import AdminFilterBar from "@/components/admin/shared/AdminFilterBar"

const STATUS_OPTIONS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "PROCESSING", label: "กำลังเตรียมจัดส่ง" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "IN_TRANSIT", label: "อยู่ระหว่างขนส่ง" },
  { value: "OUT_FOR_DELIVERY", label: "กำลังนำส่ง" },
  { value: "DELIVERED", label: "จัดส่งสำเร็จ" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "RETURNED", label: "ตีกลับ" },
]

export default function ShippingFilters({
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
      searchPlaceholder="ค้นหาชื่อผู้รับ, เบอร์โทร, เลขพัสดุ หรือเลขคำสั่งซื้อ..."
      selects={[{ key: "status", value: filters.status, onChange: (v) => onFilterChange("status", v), placeholder: "สถานะการจัดส่ง", options: STATUS_OPTIONS }]}
      onReset={onReset}
      totalCount={totalCount}
      currentCount={currentCount}
      loading={loading}
      activeSummary={[
        filters.search && `ค้นหา: "${filters.search}"`,
        filters.status !== "ALL" && `สถานะ: ${STATUS_OPTIONS.find((o) => o.value === filters.status)?.label || filters.status}`,
      ]}
    />
  )
}
