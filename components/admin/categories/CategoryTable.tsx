"use client"

import { Layers, Edit, Trash2, Calendar, CheckCircle2, BookOpen } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminCategory } from "@/hooks/admin/useCategories"

const formatDate = (dateString?: string) => (dateString ? new Date(dateString).toLocaleString("th-TH") : "-")

export default function CategoryTable({
  categories,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}: {
  categories: AdminCategory[]
  loading: boolean
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการหมวดหมู่คอร์ส</h3>
          <Badge variant="secondary">{totalCount} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">หมวดหมู่</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>จำนวนคอร์ส</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
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
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    ไม่พบหมวดหมู่
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 font-semibold text-gray-900">{record.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-gray-600" title={record.description || ""}>
                      {record.description || <span className="text-gray-400">ไม่มีรายละเอียด</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                        {record._count?.courses ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        ใช้งาน
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(record.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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

        <AdminPagination current={page} total={totalPages} onPageChange={onPageChange} className="mt-4" />
      </div>
    </TooltipProvider>
  )
}
