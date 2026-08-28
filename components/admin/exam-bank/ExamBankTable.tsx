"use client"

import { Edit, Trash2, Tag, Paperclip } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminExamBank } from "@/hooks/admin/useExamBank"

export default function ExamBankTable({
  exams,
  loading,
  filters,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onSortChange,
}: {
  exams: AdminExamBank[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (exam: AdminExamBank) => void
  onDelete: (exam: AdminExamBank) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการข้อสอบในคลัง</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field="title" label="ชื่อข้อสอบ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} className="max-w-[220px]" />
                <TableHead>รายละเอียด</TableHead>
                <SortableTableHead field="category" label="หมวดหมู่" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="fileCount" label="ไฟล์แนบ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="isActive" label="สถานะ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead className="sticky right-0 z-10 border-l border-gray-100 bg-white text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    ไม่พบข้อสอบในคลัง
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((record) => (
                  <TableRow key={record.id} className="group">
                    <TableCell className="max-w-[220px]">
                      <div className="truncate font-semibold text-gray-900" title={record.title}>
                        {record.title}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-gray-600" title={record.description || ""}>
                      {record.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                        {record.category?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                        {record._count?.files ?? record.files?.length ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={record.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-600"}>
                        {record.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => onEdit(record)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>แก้ไข</TooltipContent>
                        </Tooltip>
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
