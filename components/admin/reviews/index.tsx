"use client"
import { useState } from "react"
import { MessageSquareText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import ReviewFilters from "./ReviewFilters"
import ReviewTable from "./ReviewTable"
import DeleteModal from "./DeleteModal"

import { useReviews, type AdminReview } from "@/hooks/admin/useReviews"

export default function ReviewsManagement() {
  const { toast } = useToast()

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    reviews,
    loading,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchReviews,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useReviews()

  const handleDelete = (review: AdminReview) => {
    setReviewToDelete(review)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!reviewToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบรีวิวสำเร็จ" })
        setDeleteModalOpen(false)
        setReviewToDelete(null)
        await fetchReviews()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบรีวิว" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบรีวิว" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setReviewToDelete(null)
  }

  return (
    <AdminPageHeader
      icon={<MessageSquareText className="h-6 w-6" />}
      title="ตรวจสอบรีวิว"
      subtitle="ดูและลบรีวิวที่ไม่เหมาะสมของคอร์สเรียนและอีบุ๊ก"
    >
      <ReviewFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={reviews.length}
        loading={loading}
      />

      <ReviewTable
        reviews={reviews}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <DeleteModal open={deleteModalOpen} review={reviewToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
