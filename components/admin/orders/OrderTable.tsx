"use client"

import { Eye, User as UserIcon, BookOpen, Book, DollarSign, Calendar, FileCheck, Truck } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminOrder } from "@/hooks/admin/useOrders"

const ORDER_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอชำระเงิน", className: "border-amber-200 bg-amber-50 text-amber-700" },
  PENDING_PAYMENT: { label: "รอชำระเงิน", className: "border-amber-200 bg-amber-50 text-amber-700" },
  PENDING_VERIFICATION: { label: "รอตรวจสอบ", className: "border-blue-200 bg-blue-50 text-blue-700" },
  COMPLETED: { label: "สำเร็จ", className: "border-green-200 bg-green-50 text-green-700" },
  CANCELLED: { label: "ยกเลิก", className: "border-red-200 bg-red-50 text-red-700" },
  REFUNDED: { label: "คืนเงิน", className: "border-gray-200 bg-gray-50 text-gray-600" },
}

const PAYMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รอชำระ", className: "border-amber-200 bg-amber-50 text-amber-700" },
  PENDING_VERIFICATION: { label: "รอตรวจสอบ", className: "border-blue-200 bg-blue-50 text-blue-700" },
  COMPLETED: { label: "ชำระแล้ว", className: "border-green-200 bg-green-50 text-green-700" },
  REJECTED: { label: "ปฏิเสธ", className: "border-red-200 bg-red-50 text-red-700" },
  FAILED: { label: "ล้มเหลว", className: "border-red-200 bg-red-50 text-red-700" },
  REFUNDED: { label: "คืนเงิน", className: "border-gray-200 bg-gray-50 text-gray-600" },
}

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount || 0)

const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleString("th-TH") : "-")

export default function OrderTable({
  orders,
  loading,
  filters,
  pagination,
  onViewDetail,
  onPageChange,
  onSortChange,
}: {
  orders: AdminOrder[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onViewDetail: (order: AdminOrder) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการคำสั่งซื้อ</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field="orderNumber" label="เลขคำสั่งซื้อ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="min-w-[220px]">สินค้า</TableHead>
                <SortableTableHead field="total" label="ยอดรวม" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="status" label="สถานะคำสั่งซื้อ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>การชำระเงิน</TableHead>
                <SortableTableHead field="createdAt" label="วันที่สั่งซื้อ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead className="sticky right-0 z-10 border-l border-gray-100 bg-white text-right">การดำเนินการ</TableHead>
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
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400">
                    ไม่พบคำสั่งซื้อ
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((record) => {
                  const orderStatusMeta = ORDER_STATUS_META[record.status] || { label: record.status, className: "" }
                  const paymentStatusMeta = record.payment
                    ? PAYMENT_STATUS_META[record.payment.status] || { label: record.payment.status, className: "" }
                    : { label: "ไม่มีข้อมูล", className: "border-gray-200 bg-gray-50 text-gray-500" }

                  return (
                    <TableRow key={record.id} className="group">
                      <TableCell className="font-mono text-sm">#{record.orderNumber || record.id.slice(-8)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                            <UserIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">{record.user?.name || "-"}</div>
                            <div className="truncate text-xs text-gray-400">{record.user?.email || "-"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          {record.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-1.5">
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                                  item.itemType === "EBOOK" ? "bg-purple-500" : "bg-blue-500"
                                }`}
                              >
                                {item.itemType === "EBOOK" ? <Book className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold text-gray-900" title={item.title}>
                                  {item.title}
                                  {item.quantity > 1 && <span className="ml-1 text-gray-400">x{item.quantity}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                          {record.items.length === 0 && <span className="text-xs text-gray-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCurrency(record.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={orderStatusMeta.className}>
                          {orderStatusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={paymentStatusMeta.className}>
                          {paymentStatusMeta.label}
                        </Badge>
                        <div className="mt-1 flex flex-col gap-1">
                          {record.payment?.slipUrl && (
                            <Badge variant="outline" className="w-fit gap-1 border-blue-200 bg-blue-50 text-[10px] text-blue-700">
                              <FileCheck className="h-2.5 w-2.5" /> มีสลิป
                            </Badge>
                          )}
                          {record.shipping && (
                            <Badge variant="outline" className="w-fit gap-1 border-orange-200 bg-orange-50 text-[10px] text-orange-700">
                              <Truck className="h-2.5 w-2.5" /> จัดส่ง
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(record.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => onViewDetail(record)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ดูรายละเอียด</TooltipContent>
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
