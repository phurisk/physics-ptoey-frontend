"use client"

import { Pencil, Trash2, Layers, ImageOff } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SortableTableHead from "@/components/admin/shared/SortableTableHead"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import { getSubjectLabel } from "@/lib/constants"
import type { AdminFlashcardDeck } from "@/hooks/admin/useFlashcardDecks"

export default function DeckTable({
  decks,
  loading,
  filters,
  pagination,
  onManageCards,
  onEdit,
  onDelete,
  onPageChange,
  onSortChange,
}: {
  decks: AdminFlashcardDeck[]
  loading: boolean
  filters: { sortBy: string; sortOrder: string }
  pagination: { current: number; total: number; pageSize: number }
  onManageCards: (deck: AdminFlashcardDeck) => void
  onEdit: (deck: AdminFlashcardDeck) => void
  onDelete: (deck: AdminFlashcardDeck) => void
  onPageChange: (page: number) => void
  onSortChange: (field: string) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการชุดแฟลชการ์ด</h3>
          <Badge variant="secondary">{pagination.total} ชุด</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รูปปก</TableHead>
                <SortableTableHead field="title" label="ชื่อชุด" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <SortableTableHead field="subject" label="วิชา" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={onSortChange} />
                <TableHead>จำนวนการ์ด</TableHead>
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
              ) : decks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    ไม่พบชุดแฟลชการ์ด
                  </TableCell>
                </TableRow>
              ) : (
                decks.map((deck) => (
                  <TableRow key={deck.id} className="group">
                    <TableCell>
                      <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                        {deck.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={deck.coverImageUrl} alt={deck.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="truncate font-semibold text-gray-900" title={deck.title}>
                        {deck.title}
                      </div>
                      {deck.topic && <div className="truncate text-xs text-gray-400">หัวข้อ: {deck.topic.name}</div>}
                    </TableCell>
                    <TableCell>{getSubjectLabel(deck.subject)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deck._count?.cards ?? 0} ใบ</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={deck.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"}>
                        {deck.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-purple-600" onClick={() => onManageCards(deck)}>
                              <Layers className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>จัดการการ์ด</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onEdit(deck)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>แก้ไข</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(deck)}>
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
