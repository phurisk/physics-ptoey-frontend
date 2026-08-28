"use client"
import { useState } from "react"
import { Users, Plus, GraduationCap, UserCog, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"

import UserFilters from "./UserFilters"
import UserTable from "./UserTable"
import UserModal from "./UserModal"
import DeleteModal from "./DeleteModal"

import { useUsers, type AdminUser } from "@/hooks/admin/useUsers"

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">{icon}</div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-xl font-semibold text-gray-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UsersManagement() {
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    users,
    loading,
    stats,
    filters,
    searchInput,
    setSearchInput,
    pagination,
    fetchUsers,
    handleFilterChange,
    handlePageChange,
    handleSortChange,
    resetFilters,
  } = useUsers()

  const handleSubmitUser = async (userData: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const res = editing
        ? await fetch(`/api/admin/users/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          })
        : await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          })

      const result = await res.json()
      if (result.success) {
        toast({ title: editing ? "แก้ไขผู้ใช้งานสำเร็จ" : "สร้างผู้ใช้งานสำเร็จ" })
        setModalOpen(false)
        setEditing(null)
        fetchUsers()
      } else {
        toast({ variant: "destructive", title: result.error || "เกิดข้อผิดพลาด" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (user: AdminUser) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete?.id) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast({ title: "ลบผู้ใช้งานสำเร็จ" })
        setDeleteModalOpen(false)
        setUserToDelete(null)
        await fetchUsers()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการลบผู้ใช้งาน" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการลบผู้ใช้งาน" })
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const openModal = (record: AdminUser | null) => {
    setEditing(record || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <AdminPageHeader
      icon={<Users className="h-6 w-6" />}
      title="จัดการผู้ใช้งาน"
      subtitle="ดูและจัดการบัญชีผู้ใช้งานทั้งหมดในระบบ"
      actions={
        <Button onClick={() => openModal(null)}>
          <Plus className="mr-2 h-4 w-4" />
          สร้างผู้ใช้งานใหม่
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="ผู้ใช้งานทั้งหมด" value={stats.total} />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="นักเรียน" value={stats.students} />
        <StatCard icon={<UserCog className="h-5 w-5" />} label="ผู้สอน" value={stats.instructors} />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="ผู้ดูแลระบบ" value={stats.admins} />
      </div>

      <UserFilters
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        totalCount={pagination.total}
        currentCount={users.length}
        loading={loading}
      />

      <UserTable
        users={users}
        loading={loading}
        filters={filters as { sortBy: string; sortOrder: string }}
        pagination={pagination}
        onEdit={openModal}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <UserModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitUser} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} user={userToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />
    </AdminPageHeader>
  )
}
