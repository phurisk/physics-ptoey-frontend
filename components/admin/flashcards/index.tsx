"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Layers, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import CardTable from "./CardTable"
import CardModal from "./CardModal"
import BulkImportModal from "./BulkImportModal"
import DeleteModal from "./DeleteModal"

import { useFlashcards, type AdminFlashcard } from "@/hooks/admin/useFlashcards"
import { getSubjectLabel } from "@/lib/constants"

type DeckInfo = { id: string; title: string; subject: string; _count?: { cards: number } }

export default function FlashcardsManagement() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams<{ deckId: string }>()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<DeckInfo | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFlashcard | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminFlashcard | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { cards, loading, pagination, fetchCards, handlePageChange } = useFlashcards(deckId)

  const refreshDeckInfo = async () => {
    const res = await fetch(`/api/admin/flashcard-decks/${deckId}`)
    const json = await res.json()
    if (json.success) setDeck(json.data)
  }

  useEffect(() => {
    refreshDeckInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  const openModal = (card: AdminFlashcard | null) => {
    setEditing(card)
    setModalOpen(true)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/flashcards/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        : await fetch("/api/admin/flashcards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, deckId }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: editing ? "แก้ไขการ์ดสำเร็จ" : "เพิ่มการ์ดสำเร็จ" })
      setModalOpen(false)
      setEditing(null)
      fetchCards()
      refreshDeckInfo()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkImport = async (text: string) => {
    setBulkSubmitting(true)
    try {
      const res = await fetch("/api/admin/flashcards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, text }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "นำเข้าไม่สำเร็จ")
      toast({ title: json.message })
      setBulkOpen(false)
      fetchCards()
      refreshDeckInfo()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "นำเข้าไม่สำเร็จ" })
    } finally {
      setBulkSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/flashcards/${deleting.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบการ์ดสำเร็จ" })
      setDeleteOpen(false)
      setDeleting(null)
      fetchCards()
      refreshDeckInfo()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<Layers className="h-6 w-6" />}
      title="จัดการการ์ด"
      subtitle={
        deck ? (
          <span className="flex flex-wrap items-center gap-2">
            {deck.title}
            <Badge variant="outline">{getSubjectLabel(deck.subject)}</Badge>
            <Badge variant="secondary">{deck._count?.cards ?? 0} ใบ</Badge>
          </span>
        ) : (
          "..."
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/flashcard-decks")}>
            กลับไปชุดแฟลชการ์ด
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            นำเข้าเป็นชุด
          </Button>
          <Button onClick={() => openModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มการ์ดใหม่
          </Button>
        </div>
      }
    >
      <CardTable
        cards={cards}
        loading={loading}
        pagination={pagination}
        onEdit={openModal}
        onDelete={(card) => {
          setDeleting(card)
          setDeleteOpen(true)
        }}
        onPageChange={handlePageChange}
      />

      <CardModal open={modalOpen} editing={editing} submitting={submitting} onOpenChange={setModalOpen} onSubmit={handleSubmit} />
      <BulkImportModal open={bulkOpen} submitting={bulkSubmitting} onOpenChange={setBulkOpen} onSubmit={handleBulkImport} />
      <DeleteModal open={deleteOpen} card={deleting} loading={deleteLoading} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </AdminPageHeader>
  )
}
