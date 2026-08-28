"use client"

import { Trash2, Star, BookOpen, BookText, ShieldCheck } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminReview } from "@/hooks/admin/useReviews"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  )
}

const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)) : "-"

export default function ReviewTable({
  reviews,
  loading,
  filters,
  pagination,
  onDelete,
  onPageChange,
  onSortChange,
}: {
  reviews: AdminReview[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onDelete: (review: AdminReview) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการรีวิว</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้เขียนรีวิว</TableHead>
                <TableHead>เป้าหมาย</TableHead>
                <SortableTableHead field="rating" label="คะแนน" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead className="max-w-[280px]">ความเห็น</TableHead>
                <TableHead>สถานะ</TableHead>
                <SortableTableHead field="createdAt" label="วันที่" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead className="sticky right-0 z-10 border-l border-gray-100 bg-white text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    ไม่พบรีวิว
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((record) => (
                  <TableRow key={record.id} className="group">
                    <TableCell>
                      <div className="font-medium text-gray-900">{record.user?.name || "-"}</div>
                      <div className="text-xs text-gray-400">{record.user?.email || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        {record.course ? (
                          <>
                            <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                            <span className="truncate max-w-[160px]" title={record.course.title}>{record.course.title}</span>
                          </>
                        ) : record.ebook ? (
                          <>
                            <BookText className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                            <span className="truncate max-w-[160px]" title={record.ebook.title}>{record.ebook.title}</span>
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={record.rating} />
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      {record.title && <div className="text-sm font-medium text-gray-800 truncate">{record.title}</div>}
                      <div className="truncate text-sm text-gray-500" title={record.comment || ""}>
                        {record.comment || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {record.isVerified ? (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            ผู้ซื้อจริง
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500">
                            ยังไม่ยืนยัน
                          </Badge>
                        )}
                        {!record.isActive && (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                            ปิดใช้งาน
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(record.createdAt)}</TableCell>
                    <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => onDelete(record)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>ลบ</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AdminPagination current={pagination.current} total={totalPages} onPageChange={onPageChange} className="mt-4" />
      </div>
    </TooltipProvider>
  )
}
