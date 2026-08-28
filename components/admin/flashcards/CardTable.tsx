"use client"

import { Pencil, Trash2, MessageSquareText, ListChecks, Keyboard } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AdminPagination from "@/components/admin/shared/AdminPagination"
import type { AdminFlashcard } from "@/hooks/admin/useFlashcards"

const MODE_META: Record<AdminFlashcard["answerMode"], { label: string; icon: typeof MessageSquareText }> = {
  SELF_GRADE: { label: "ให้คะแนนตัวเอง", icon: MessageSquareText },
  MULTIPLE_CHOICE: { label: "ปรนัย", icon: ListChecks },
  TYPED: { label: "พิมพ์คำตอบ", icon: Keyboard },
}

export default function CardTable({
  cards,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
}: {
  cards: AdminFlashcard[]
  loading: boolean
  pagination: { current: number; total: number; pageSize: number }
  onEdit: (card: AdminFlashcard) => void
  onDelete: (card: AdminFlashcard) => void
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการการ์ด</h3>
          <Badge variant="secondary">{pagination.total} ใบ</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลำดับ</TableHead>
                <TableHead className="min-w-[240px]">หน้า (คำถาม)</TableHead>
                <TableHead>รูปแบบคำตอบ</TableHead>
                <TableHead className="sticky right-0 z-10 border-l border-gray-100 bg-white text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : cards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    ยังไม่มีการ์ดในชุดนี้
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => {
                  const meta = MODE_META[card.answerMode]
                  const Icon = meta.icon
                  return (
                    <TableRow key={card.id} className="group">
                      <TableCell>{card.order}</TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="truncate text-sm text-gray-900" title={card.front}>
                          {card.front}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-gray-100 bg-white group-hover:bg-muted/50">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => onEdit(card)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>แก้ไข</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => onDelete(card)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ลบ</TooltipContent>
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
