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
import QuickGrantCourseModal from "./QuickGrantCourseModal"
import TokenModal from "./TokenModal"

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
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [grantUser, setGrantUser] = useState<AdminUser | null>(null)
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [tokenUser, setTokenUser] = useState<AdminUser | null>(null)

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

  const handleToggleRole = async (user: AdminUser) => {
    const nextRole = user.role === "STUDENT" ? "INSTRUCTOR" : "STUDENT"
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, email: user.email, role: nextRole, school: user.school }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: `เปลี่ยนบทบาทเป็น${nextRole === "INSTRUCTOR" ? "ผู้สอน" : "นักเรียน"}สำเร็จ` })
        fetchUsers()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท" })
    }
  }

  const openGrantModal = (user: AdminUser) => {
    setGrantUser(user)
    setGrantModalOpen(true)
  }
  const closeGrantModal = () => {
    setGrantModalOpen(false)
    setGrantUser(null)
  }
  const handleQuickGrant = async (courseId: string, accessDuration: number | null) => {
    if (!grantUser?.id) return
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: grantUser.id, courseIds: [courseId], accessDuration }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการเพิ่มคอร์ส" })
        return
      }
      if (data.granted?.length) toast({ title: `เพิ่มคอร์สสำเร็จ: ${data.granted.join(", ")}` })
      if (data.alreadyEnrolled?.length) toast({ title: `ผู้ใช้มีคอร์สนี้อยู่แล้ว: ${data.alreadyEnrolled.join(", ")}` })
      closeGrantModal()
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการเพิ่มคอร์ส" })
    }
  }

  const openTokenModal = (user: AdminUser) => {
    setTokenUser(user)
    setTokenModalOpen(true)
  }
  const closeTokenModal = () => {
    setTokenModalOpen(false)
    setTokenUser(null)
  }
  const handleSubmitTokens = async (tokens: number) => {
    if (!tokenUser?.id) return
    try {
      const res = await fetch(`/api/admin/users/${tokenUser.id}/practice-tokens`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "แก้ไขยอด token สำเร็จ" })
        closeTokenModal()
      } else {
        toast({ variant: "destructive", title: data.error || "เกิดข้อผิดพลาดในการแก้ไข token" })
      }
    } catch {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการแก้ไข token" })
    }
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
        onToggleRole={handleToggleRole}
        onGrantCourse={openGrantModal}
        onManageTokens={openTokenModal}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />

      <UserModal open={modalOpen} editing={editing} onCancel={closeModal} onSubmit={handleSubmitUser} submitting={submitting} />

      <DeleteModal open={deleteModalOpen} user={userToDelete} loading={deleting} onConfirm={confirmDelete} onCancel={cancelDelete} />

      <QuickGrantCourseModal open={grantModalOpen} user={grantUser} onCancel={closeGrantModal} onSubmit={handleQuickGrant} />

      <TokenModal open={tokenModalOpen} user={tokenUser} onCancel={closeTokenModal} onSubmit={handleSubmitTokens} />
    </AdminPageHeader>
  )
}
