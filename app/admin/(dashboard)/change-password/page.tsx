"use client"

import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function ChangePasswordPage() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isValid = currentPassword && newPassword.length >= 6 && newPassword === confirmPassword

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
      toast({ title: "เปลี่ยนรหัสผ่านสำเร็จ" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminPageHeader icon={<KeyRound className="h-6 w-6" />} title="เปลี่ยนรหัสผ่าน" subtitle="เปลี่ยนรหัสผ่านสำหรับบัญชีผู้ดูแลระบบของคุณ">
      <div className="max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>รหัสผ่านปัจจุบัน</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ยืนยันรหัสผ่านใหม่</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-600">รหัสผ่านไม่ตรงกัน</p>}
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            บันทึกรหัสผ่านใหม่
          </Button>
        </div>
      </div>
    </AdminPageHeader>
  )
}
