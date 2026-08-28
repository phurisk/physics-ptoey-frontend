"use client"

import { Edit, Trash2, School, Mail } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminUser } from "@/hooks/admin/useUsers"

const ROLE_STYLES: Record<string, string> = {
  STUDENT: "border-blue-200 bg-blue-50 text-blue-700",
  INSTRUCTOR: "border-purple-200 bg-purple-50 text-purple-700",
  ADMIN: "border-red-200 bg-red-50 text-red-700",
}
const ROLE_LABELS: Record<string, string> = { STUDENT: "นักเรียน", INSTRUCTOR: "ผู้สอน", ADMIN: "ผู้ดูแลระบบ" }

const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)) : "-"

const initials = (name?: string | null) =>
  (name || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase()

export default function UserTable({
  users,
  loading,
  filters,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onSortChange,
}: {
  users: AdminUser[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการผู้ใช้งาน</h3>
          <Badge variant="secondary">{pagination.total} รายการ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead field="name" label="ชื่อ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="email" label="อีเมล" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>โรงเรียน</TableHead>
                <SortableTableHead field="role" label="บทบาท" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>คำสั่งซื้อ</TableHead>
                <SortableTableHead field="createdAt" label="สมัครเมื่อ" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400">
                    ไม่พบผู้ใช้งาน
                  </TableCell>
                </TableRow>
              ) : (
                users.map((record) => (
                  <TableRow key={record.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.image || undefined} alt={record.name || ""} />
                          <AvatarFallback>{initials(record.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">{record.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {record.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <School className="h-3.5 w-3.5 text-gray-400" />
                        {record.school || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_STYLES[record.role]}>
                        {ROLE_LABELS[record.role] || record.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{record._count?.orders ?? 0}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(record.createdAt)}</TableCell>
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
