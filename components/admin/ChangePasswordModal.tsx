"use client"
import { useState } from "react"
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

const EMPTY_VALUES = { currentPassword: "", newPassword: "", confirmPassword: "" }

export default function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleClose = () => {
    setValues(EMPTY_VALUES)
    setError("")
    onClose()
  }

  const handleChange = (field: keyof typeof EMPTY_VALUES) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (values.newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร")
      return
    }
    if (values.newPassword !== values.confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      })
      const result = await res.json()

      if (!res.ok || !result.success) {
        setError(result.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
        return
      }

      toast({ title: "เปลี่ยนรหัสผ่านสำเร็จ" })
      handleClose()
    } catch {
      setError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>แก้ไขรหัสผ่าน</DialogTitle>
          <DialogDescription>เปลี่ยนรหัสผ่านสำหรับบัญชีผู้ดูแลของคุณ</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">รหัสผ่านเดิม</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่านเดิม"
                value={values.currentPassword}
                onChange={handleChange("currentPassword")}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านใหม่"
                value={values.newPassword}
                onChange={handleChange("newPassword")}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={values.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึก"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
