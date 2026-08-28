"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import { getQuestionTypeLabel } from "@/lib/constants"
import type { AdminMockQuestion } from "@/hooks/admin/useMockExamQuestions"

export default function MockQuestionTable({
  questions,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
}: {
  questions: AdminMockQuestion[]
  loading: boolean
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (question: AdminMockQuestion) => void
  onDelete: (question: AdminMockQuestion) => void
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการคำถาม</h3>
          <Badge variant="secondary">{pagination.total} ข้อ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลำดับ</TableHead>
                <TableHead className="min-w-[280px]">คำถาม</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หัวข้อ</TableHead>
                <TableHead>คะแนน</TableHead>
                <TableHead>ตอบแล้ว</TableHead>
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
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    ยังไม่มีคำถามในข้อสอบนี้
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id} className="group">
                    <TableCell>{q.order}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <div className="truncate text-sm text-gray-900" title={q.questionText}>
                        {q.questionText}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getQuestionTypeLabel(q.questionType)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{q.topic?.name || "-"}</TableCell>
                    <TableCell>{q.marks}</TableCell>
                    <TableCell>{q._count?.answers ?? 0}</TableCell>
                    <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onEdit(q)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>แก้ไข</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(q)}>
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
