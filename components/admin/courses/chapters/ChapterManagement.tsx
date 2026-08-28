"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Layers,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileVideo,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import ChapterModal from "./ChapterModal"
import ContentModal from "./ContentModal"
import type { AdminChapter, AdminContent } from "./types"

const CONTENT_TYPE_META: Record<AdminContent["contentType"], { label: string; icon: typeof FileVideo }> = {
  VIDEO: { label: "วิดีโอ", icon: FileVideo },
  PDF: { label: "PDF", icon: FileText },
  LINK: { label: "ลิงก์", icon: LinkIcon },
  QUIZ: { label: "แบบทดสอบ", icon: HelpCircle },
  ASSIGNMENT: { label: "งานที่มอบหมาย", icon: ClipboardList },
}

export default function ChapterManagement({ courseId }: { courseId: string }) {
  const { toast } = useToast()
  const [courseTitle, setCourseTitle] = useState("")
  const [chapters, setChapters] = useState<AdminChapter[]>([])
  const [loading, setLoading] = useState(true)

  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<AdminChapter | null>(null)
  const [chapterSubmitting, setChapterSubmitting] = useState(false)
  const [deletingChapter, setDeletingChapter] = useState<AdminChapter | null>(null)

  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [contentChapterId, setContentChapterId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<AdminContent | null>(null)
  const [contentSubmitting, setContentSubmitting] = useState(false)
  const [deletingContent, setDeletingContent] = useState<{ chapterId: string; content: AdminContent } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ")
      setCourseTitle(json.data.title)
      setChapters(
        [...json.data.chapters].sort((a: AdminChapter, b: AdminChapter) => a.order - b.order).map((c: AdminChapter) => ({
          ...c,
          contents: [...c.contents].sort((a, b) => a.order - b.order),
        }))
      )
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ" })
    } finally {
      setLoading(false)
    }
  }, [courseId, toast])

  useEffect(() => {
    load()
  }, [load])

  // --- Chapter CRUD ---
  const openChapterModal = (chapter: AdminChapter | null) => {
    setEditingChapter(chapter)
    setChapterModalOpen(true)
  }

  const submitChapter = async (title: string) => {
    setChapterSubmitting(true)
    try {
      const res = editingChapter
        ? await fetch(`/api/admin/courses/${courseId}/chapters/${editingChapter.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          })
        : await fetch(`/api/admin/courses/${courseId}/chapters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: "บันทึกสำเร็จ" })
      setChapterModalOpen(false)
      setEditingChapter(null)
      load()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })
    } finally {
      setChapterSubmitting(false)
    }
  }

  const confirmDeleteChapter = async () => {
    if (!deletingChapter) return
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/chapters/${deletingChapter.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบบทเรียนสำเร็จ" })
      setDeletingChapter(null)
      load()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    }
  }

  const moveChapter = async (chapter: AdminChapter, direction: -1 | 1) => {
    const sorted = [...chapters].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((c) => c.id === chapter.id)
    const swapWith = sorted[idx + direction]
    if (!swapWith) return

    await Promise.all([
      fetch(`/api/admin/courses/${courseId}/chapters/${chapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapWith.order }),
      }),
      fetch(`/api/admin/courses/${courseId}/chapters/${swapWith.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: chapter.order }),
      }),
    ])
    load()
  }

  // --- Content CRUD ---
  const openContentModal = (chapterId: string, content: AdminContent | null) => {
    setContentChapterId(chapterId)
    setEditingContent(content)
    setContentModalOpen(true)
  }

  const submitContent = async (data: { title: string; contentType: AdminContent["contentType"]; contentUrl: string }) => {
    if (!contentChapterId) return
    setContentSubmitting(true)
    try {
      const res = editingContent
        ? await fetch(`/api/admin/courses/${courseId}/chapters/${contentChapterId}/contents/${editingContent.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch(`/api/admin/courses/${courseId}/chapters/${contentChapterId}/contents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: "บันทึกสำเร็จ" })
      setContentModalOpen(false)
      setEditingContent(null)
      setContentChapterId(null)
      load()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })
    } finally {
      setContentSubmitting(false)
    }
  }

  const confirmDeleteContent = async () => {
    if (!deletingContent) return
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/chapters/${deletingContent.chapterId}/contents/${deletingContent.content.id}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบเนื้อหาสำเร็จ" })
      setDeletingContent(null)
      load()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    }
  }

  const moveContent = async (chapter: AdminChapter, content: AdminContent, direction: -1 | 1) => {
    const sorted = [...chapter.contents].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((c) => c.id === content.id)
    const swapWith = sorted[idx + direction]
    if (!swapWith) return

    await Promise.all([
      fetch(`/api/admin/courses/${courseId}/chapters/${chapter.id}/contents/${content.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapWith.order }),
      }),
      fetch(`/api/admin/courses/${courseId}/chapters/${chapter.id}/contents/${swapWith.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: content.order }),
      }),
    ])
    load()
  }

  return (
    <AdminPageHeader
      icon={<Layers className="h-6 w-6" />}
      title="จัดการบทเรียน"
      subtitle={courseTitle || "..."}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปคอร์สเรียน
            </Link>
          </Button>
          <Button onClick={() => openChapterModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มบทเรียน
          </Button>
        </div>
      }
    >
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-gray-400">กำลังโหลด...</div>
        ) : chapters.length === 0 ? (
          <div className="py-10 text-center text-gray-400">ยังไม่มีบทเรียนในคอร์สนี้</div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {chapters.map((chapter, chapterIdx) => (
              <AccordionItem key={chapter.id} value={chapter.id} className="rounded-lg border border-gray-100 px-4">
                <div className="flex items-center gap-2 py-1">
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                  <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-semibold text-gray-900">
                        บทที่ {chapterIdx + 1}: {chapter.title}
                      </span>
                      <Badge variant="secondary">{chapter.contents.length} เนื้อหา</Badge>
                    </div>
                  </AccordionTrigger>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button variant="ghost" size="icon" disabled={chapterIdx === 0} onClick={() => moveChapter(chapter, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={chapterIdx === chapters.length - 1}
                      onClick={() => moveChapter(chapter, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openChapterModal(chapter)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingChapter(chapter)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <AccordionContent>
                  <div className="space-y-2 pb-2 pl-6">
                    {chapter.contents.map((content, contentIdx) => {
                      const meta = CONTENT_TYPE_META[content.contentType]
                      const Icon = meta.icon
                      return (
                        <div key={content.id} className="flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2">
                          <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-gray-900">{content.title}</div>
                            <div className="truncate text-xs text-gray-400">{content.contentUrl}</div>
                          </div>
                          <Badge variant="outline">{meta.label}</Badge>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={contentIdx === 0}
                              onClick={() => moveContent(chapter, content, -1)}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={contentIdx === chapter.contents.length - 1}
                              onClick={() => moveContent(chapter, content, 1)}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openContentModal(chapter.id, content)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingContent({ chapterId: chapter.id, content })}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <Button variant="outline" size="sm" onClick={() => openContentModal(chapter.id, null)}>
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      เพิ่มเนื้อหา
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <ChapterModal
        open={chapterModalOpen}
        editing={editingChapter}
        submitting={chapterSubmitting}
        onOpenChange={setChapterModalOpen}
        onSubmit={submitChapter}
      />

      <ContentModal
        open={contentModalOpen}
        editing={editingContent}
        submitting={contentSubmitting}
        onOpenChange={setContentModalOpen}
        onSubmit={submitContent}
      />

      <AlertDialog open={!!deletingChapter} onOpenChange={(next) => !next && setDeletingChapter(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบบทเรียน &quot;{deletingChapter?.title}&quot;?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">เนื้อหาทั้งหมด ({deletingChapter?.contents.length ?? 0} รายการ) ในบทเรียนนี้จะถูกลบไปด้วย</p>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChapter} className="bg-red-600 hover:bg-red-700">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingContent} onOpenChange={(next) => !next && setDeletingContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบเนื้อหา &quot;{deletingContent?.content.title}&quot;?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContent} className="bg-red-600 hover:bg-red-700">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageHeader>
  )
}
