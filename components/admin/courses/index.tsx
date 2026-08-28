"use client"
import { useState } from "react"
import { BookOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import CourseFilters from "./CourseFilters"
import CourseTable from "./CourseTable"
import CourseModal from "./CourseModal"
import DeleteModal from "./DeleteModal"

import { useCourses, type AdminCourse } from "@/hooks/admin/useCourses"

export default function CoursesManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCourse | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<AdminCourse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    courses,
    loading,
    categories,
    instructors,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchCourses,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useCourses()

  const handleSubmitCourse = async (courseData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/courses/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(courseData),
          })
        : await fetch("/api/admin/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(courseData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขคอร์สสำเร็จ" : "สร้างคอร์สสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchCourses()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (course: AdminCourse) => {
    setCourseToDelete(course)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!courseToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบคอร์สสำเร็จ" })
        setDeleteModalOpen(false)
        setCourseToDelete(null)
        await fetchCourses()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบคอร์ส" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบคอร์ส" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setCourseToDelete(null)
  }

  const openModal = (record: AdminCourse | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<BookOpen className="h-6 w-6" />}
      title="จัดการคอร์สเรียน"
      subtitle="สร้างและจัดการคอร์สเรียนออนไลน์"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างคอร์สใหม่
        </Button>
      }
    >
      <CourseFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        instructors={instructors}
        categories={categories}
        totalCount={pagination.total}
        currentCount={courses.length}
        loading={loading}
      />

      <CourseTable
        courses={courses}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <CourseModal
        open={modalOpen}
        editing={editing}
        onCancel={closeModal}
        onSubmit={handleSubmitCourse}
        instructors={instructors}
        categories={categories}
        submitting={submitting}
      />

      <DeleteModal open={deleteModalOpen} course={courseToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
