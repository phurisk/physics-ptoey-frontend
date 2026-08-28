"use client"
import { useState } from "react"
import { Newspaper, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import PostFilters from "./PostFilters"
import PostTable from "./PostTable"
import PostModal from "./PostModal"
import DeleteModal from "./DeleteModal"

import { usePosts, type AdminPost } from "@/hooks/admin/usePosts"

export default function PostsManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPost | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<AdminPost | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    posts,
    loading,
    postTypes,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchPosts,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = usePosts()

  const handleSubmitPost = async (postData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/posts/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          })
        : await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขบทความสำเร็จ" : "สร้างบทความสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchPosts()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (post: AdminPost) => {
    setPostToDelete(post)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!postToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/posts/${postToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบบทความสำเร็จ" })
        setDeleteModalOpen(false)
        setPostToDelete(null)
        await fetchPosts()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบบทความ" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบบทความ" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setPostToDelete(null)
  }

  const openModal = (record: AdminPost | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<Newspaper className="h-6 w-6" />}
      title="จัดการบทความ"
      subtitle="สร้างและจัดการบทความ/ข่าวสาร"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างบทความใหม่
        </Button>
      }
    >
      <PostFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        postTypes={postTypes}
        totalCount={pagination.total}
        currentCount={posts.length}
        loading={loading}
      />

      <PostTable
        posts={posts}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <PostModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitPost} postTypes={postTypes} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} post={postToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
