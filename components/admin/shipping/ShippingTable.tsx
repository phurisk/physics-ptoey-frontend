"use client"

import { Pencil, User as UserIcon, MapPin, Truck, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminShipping } from "@/hooks/admin/useShipping"

const formatDate = (dateString?: string) => (dateString ? new Date(dateString).toLocaleString("th-TH") : "-")

const METHOD_META: Record<string, { label: string; className: string }> = {
  STANDARD: { label: "จัดส่งธรรมดา", className: "text-gray-600" },
  EXPRESS: { label: "จัดส่งด่วน", className: "text-orange-600" },
  KERRY: { label: "Kerry Express", className: "text-orange-600" },
  THAILAND_POST: { label: "ไปรษณีย์ไทย", className: "text-red-600" },
  JT_EXPRESS: { label: "J&T Express", className: "text-red-600" },
  FLASH_EXPRESS: { label: "Flash Express", className: "text-yellow-600" },
  NINJA_VAN: { label: "Ninja Van", className: "text-red-600" },
  DHL: { label: "DHL", className: "text-yellow-600" },
  FEDEX: { label: "FedEx", className: "text-purple-600" },
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอดำเนินการ", className: "border-amber-200 bg-amber-50 text-amber-700" },
  PROCESSING: { label: "กำลังเตรียมจัดส่ง", className: "border-blue-200 bg-blue-50 text-blue-700" },
  SHIPPED: { label: "จัดส่งแล้ว", className: "border-blue-200 bg-blue-50 text-blue-700" },
  IN_TRANSIT: { label: "อยู่ระหว่างขนส่ง", className: "border-blue-200 bg-blue-50 text-blue-700" },
  OUT_FOR_DELIVERY: { label: "กำลังนำส่ง", className: "border-blue-200 bg-blue-50 text-blue-700" },
  DELIVERED: { label: "จัดส่งสำเร็จ", className: "border-green-200 bg-green-50 text-green-700" },
  CANCELLED: { label: "ยกเลิก", className: "border-red-200 bg-red-50 text-red-700" },
  RETURNED: { label: "ตีกลับ", className: "border-gray-200 bg-gray-50 text-gray-600" },
}

export default function ShippingTable({
  shipments,
  loading,
  filters,
  pagination,
  onEdit,
  onPageChange,
  onSortChange,
}: {
  shipments: AdminShipping[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (shipping: AdminShipping) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการจัดส่ง</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>คำสั่งซื้อ</TableHead>
                <TableHead>ผู้รับ</TableHead>
                <TableHead className="min-w-[220px]">ที่อยู่</TableHead>
                <TableHead>ขนส่ง</TableHead>
                <TableHead>เลขพัสดุ</TableHead>
                <SortableTableHead field="status" label="สถานะ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="createdAt" label="วันที่สร้าง" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead className="sticky right-0 z-10 border-l border-gray-100 bg-white text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400">
                    ไม่พบข้อมูลการจัดส่ง
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((s) => {
                  const meta = STATUS_META[s.status] || { label: s.status, className: "" }
                  const methodMeta = METHOD_META[s.shippingMethod] || { label: s.shippingMethod, className: "text-gray-600" }
                  return (
                    <TableRow key={s.id} className="group">
                      <TableCell className="font-mono text-sm">#{s.order.orderNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-400">{s.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex items-start gap-1.5 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">
                            {s.address}, {s.district}, {s.province} {s.postalCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 text-sm font-medium ${methodMeta.className}`}>
                          <Truck className="h-3.5 w-3.5" />
                          {methodMeta.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{s.trackingNumber || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(s.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => onEdit(s)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>แก้ไข</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <AdminPagination current={pagination.current} total={totalPages} onPageChange={onPageChange} className="mt-4" />
      </div>
    </TooltipProvider>
  )
}
