"use client"

import { Edit, Trash2, User as UserIcon, Tag, ImageOff, Star, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminPost } from "@/hooks/admin/usePosts"

const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-")

export default function PostTable({
  posts,
  loading,
  filters,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onSortChange,
}: {
  posts: AdminPost[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (post: AdminPost) => void
  onDelete: (post: AdminPost) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการบทความ</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ภาพ</TableHead>
                <SortableTableHead field="title" label="ชื่อบทความ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} className="max-w-[220px]" />
                <SortableTableHead field="postType" label="ประเภท" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="author" label="ผู้เขียน" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>สถานะ</TableHead>
                <SortableTableHead field="publishedAt" label="เผยแพร่เมื่อ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
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
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    ไม่พบบทความ
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((record) => (
                  <TableRow key={record.id} className={`group ${!record.isActive ? "opacity-60" : ""}`}>
                    <TableCell>
                      <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                        {record.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={record.imageUrl} alt={record.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900" title={record.title}>
                        {record.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <span className="truncate">{record.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                        {record.postType?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                        {record.author?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={record.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-600"}>
                        {record.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(record.publishedAt)}
                      </div>
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
