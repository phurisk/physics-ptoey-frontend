"use client"

import { Pencil, Trash2, ListChecks, Clock, DollarSign } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import { getSubjectLabel } from "@/lib/constants"
import type { AdminMockExam } from "@/hooks/admin/useMockExams"

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount || 0)

export default function MockExamTable({
  exams,
  loading,
  filters,
  pagination,
  onEdit,
  onManageQuestions,
  onDelete,
  onPageChange,
  onSortChange,
}: {
  exams: AdminMockExam[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (exam: AdminMockExam) => void
  onManageQuestions: (exam: AdminMockExam) => void
  onDelete: (exam: AdminMockExam) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการข้อสอบจำลอง</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field="title" label="ชื่อข้อสอบ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="subject" label="วิชา" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>จำนวนข้อ</TableHead>
                <TableHead>เวลาจำกัด</TableHead>
                <SortableTableHead field="price" label="ราคา" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>โหมด</TableHead>
                <SortableTableHead field="isActive" label="สถานะ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
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
              ) : exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400">
                    ไม่พบข้อสอบจำลอง
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id} className="group">
                    <TableCell className="max-w-[220px]">
                      <div className="truncate font-semibold text-gray-900" title={exam.title}>
                        {exam.title}
                      </div>
                      {exam.course && <div className="truncate text-xs text-gray-400">คอร์ส: {exam.course.title}</div>}
                    </TableCell>
                    <TableCell>{getSubjectLabel(exam.subject)}</TableCell>
                    <TableCell>{exam._count?.questions ?? 0} ข้อ</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {exam.timeLimit ? `${exam.timeLimit} นาที` : "ไม่จำกัด"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {exam.price ? (
                        <div className="flex items-center gap-1 font-semibold text-green-600">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCurrency(exam.discountPrice || exam.price)}
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                          ฟรี
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {exam.allowPracticeMode && <Badge variant="outline">ฝึกซ้อม</Badge>}
                        {exam.allowRealMode && <Badge variant="outline">สอบจริง</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={exam.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"}>
                        {exam.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-purple-600" onClick={() => onManageQuestions(exam)}>
                              <ListChecks className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>จัดการคำถาม</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onEdit(exam)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>แก้ไข</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(exam)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
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
