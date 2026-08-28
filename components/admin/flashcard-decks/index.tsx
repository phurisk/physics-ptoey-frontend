"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layers, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import DeckFilters from "./DeckFilters"
import DeckTable from "./DeckTable"
import DeckModal from "./DeckModal"
import DeleteModal from "./DeleteModal"

import { useFlashcardDecks, type AdminFlashcardDeck } from "@/hooks/admin/useFlashcardDecks"

export default function FlashcardDecksManagement() {
  const { toast } = useToast()
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFlashcardDeck | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminFlashcardDeck | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    decks,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchDecks,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useFlashcardDecks()

  const openModal = (deck: AdminFlashcardDeck | null) => {
    setEditing(deck)
    setModalOpen(true)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/flashcard-decks/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/flashcard-decks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: editing ? "แก้ไขชุดแฟลชการ์ดสำเร็จ" : "สร้างชุดแฟลชการ์ดสำเร็จ" })
      setModalOpen(false)
      setEditing(null)
      fetchDecks()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/flashcard-decks/${deleting.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบชุดแฟลชการ์ดสำเร็จ" })
      setDeleteOpen(false)
      setDeleting(null)
      fetchDecks()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<Layers className="h-6 w-6" />}
      title="ชุดแฟลชการ์ด (Flashcards)"
      subtitle="จัดการชุดแฟลชการ์ดสำหรับการทบทวนแบบ spaced repetition"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างชุดใหม่
        </Button>
      }
    >
      <DeckFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={decks.length}
        loading={loading}
      />

      <DeckTable
        decks={decks}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onManageCards={(deck) => router.push(`/admin/flashcard-decks/cards/${deck.id}`)}
        onEdit={openModal}
        onDelete={(deck) => {
          setDeleting(deck)
          setDeleteOpen(true)
        }}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <DeckModal open={modalOpen} editing={editing} submitting={submitting} onOpenChange={setModalOpen} onSubmit={handleSubmit} />
      <DeleteModal open={deleteOpen} deck={deleting} loading={deleteLoading} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </AdminPageHeader>
  )
}
