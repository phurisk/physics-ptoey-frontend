"use client"

import { Edit, Trash2, CheckCircle2, XCircle, ImageIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getQuestionTypeLabel } from "@/lib/constants"
import type { AdminQuestion } from "@/hooks/admin/useExamQuestions"

export default function QuestionTable({
  questions,
  loading,
  onEdit,
  onDelete,
}: {
  questions: AdminQuestion[]
  loading: boolean
  onEdit: (question: AdminQuestion) => void
  onDelete: (question: AdminQuestion) => void
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">รายการคำถาม</h3>
          <Badge variant="secondary">{questions.length} คำถาม</Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>คำถาม</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ตัวเลือก / เฉลย</TableHead>
                <TableHead>คะแนน</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400">
                    ยังไม่มีคำถามในข้อสอบนี้
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q, idx) => (
                  <TableRow key={q.id} className="group align-top">
                    <TableCell className="text-sm text-gray-500">{idx + 1}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <div className="whitespace-pre-wrap text-sm text-gray-900">{q.questionText}</div>
                      {q.questionImage && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <ImageIcon className="h-3 w-3" />
                          มีรูปภาพประกอบ
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getQuestionTypeLabel(q.questionType)}</Badge>
                    </TableCell>
                    <TableCell>
                      {q.questionType === "SHORT_ANSWER" ? (
                        <span className="text-sm text-gray-400">ตรวจให้เต็มคะแนนอัตโนมัติ</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {q.options.map((o) => (
                            <li key={o.id} className="flex items-center gap-1.5 text-sm">
                              {o.isCorrect ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                              )}
                              <span className={o.isCorrect ? "font-medium text-gray-900" : "text-gray-600"}>{o.optionText}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">{q.marks}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => onEdit(q)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>แก้ไข</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => onDelete(q)}>
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
      </div>
    </TooltipProvider>
  )
}
