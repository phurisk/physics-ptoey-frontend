"use client"
import { useState } from "react"
import { ListTree, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import MockTopicFilters from "./MockTopicFilters"
import MockTopicTable from "./MockTopicTable"
import MockTopicModal from "./MockTopicModal"
import DeleteModal from "./DeleteModal"

import { useMockTopics, type AdminMockTopic } from "@/hooks/admin/useMockTopics"

export default function MockTopicsManagement() {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminMockTopic | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminMockTopic | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const {
    topics,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchTopics,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useMockTopics()

  const openModal = (topic: AdminMockTopic | null) => {
    setEditing(topic)
    setModalOpen(true)
  }

  const handleSubmit = async (data: { subject: string; name: string }) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/mock-topics/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/mock-topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "บันทึกไม่สำเร็จ")
      toast({ title: editing ? "แก้ไขหัวข้อสำเร็จ" : "สร้างหัวข้อสำเร็จ" })
      setModalOpen(false)
      setEditing(null)
      fetchTopics()
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
      const res = await fetch(`/api/admin/mock-topics/${deleting.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "ลบไม่สำเร็จ")
      toast({ title: "ลบหัวข้อสำเร็จ" })
      setDeleteOpen(false)
      setDeleting(null)
      fetchTopics()
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "ลบไม่สำเร็จ" })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminPageHeader
      icon={<ListTree className="h-6 w-6" />}
      title="หัวข้อข้อสอบจำลอง"
      subtitle="จัดการหัวข้อ (topic) ที่ใช้แบ่งกลุ่มคำถามข้อสอบจำลอง"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มหัวข้อใหม่
        </Button>
      }
    >
      <MockTopicFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={topics.length}
        loading={loading}
      />

      <MockTopicTable
        topics={topics}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={(topic) => {
          setDeleting(topic)
          setDeleteOpen(true)
        }}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <MockTopicModal open={modalOpen} editing={editing} submitting={submitting} onOpenChange={setModalOpen} onSubmit={handleSubmit} />
      <DeleteModal open={deleteOpen} topic={deleting} loading={deleteLoading} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </AdminPageHeader>
  )
}
