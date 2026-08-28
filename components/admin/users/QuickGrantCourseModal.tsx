"use client"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminUser } from "@/hooks/admin/useUsers"

type CourseOption = { id: string; title: string }

export default function QuickGrantCourseModal({
  open,
  user,
  onCancel,
  onSubmit,
}: {
  open: boolean
  user: AdminUser | null
  onCancel: () => void
  onSubmit: (courseId: string, accessDuration: number | null) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [courseId, setCourseId] = useState("")
  const [accessDurationDays, setAccessDurationDays] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setCourseId("")
    setAccessDurationDays("")
    setError("")

    const loadCourses = async () => {
      setCoursesLoading(true)
      try {
        const res = await fetch("/api/admin/courses?pageSize=100")
        const data = await res.json()
        if (data.success) setCourses(data.data || [])
      } catch (err) {
        console.error("Failed to load courses:", err)
      } finally {
        setCoursesLoading(false)
      }
    }
    loadCourses()
  }, [open])

  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) {
      setError("กรุณาเลือกคอร์ส")
      return
    }
    setLoading(true)
    try {
      const accessDuration = accessDurationDays ? parseInt(accessDurationDays, 10) : null
      await onSubmit(courseId, accessDuration)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>เพิ่มคอร์สให้ผู้ใช้ (ไม่ผ่านการซื้อ)</DialogTitle>
        </DialogHeader>

        <div className="-mt-2 mb-2 text-sm">
          <div className="text-gray-500">ผู้ใช้:</div>
          <div className="font-semibold text-gray-900">{user.name || "ไม่ระบุชื่อ"}</div>
          <div className="text-gray-500">{user.email}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>เลือกคอร์ส</Label>
            <Select value={courseId} onValueChange={(v) => { setCourseId(v); setError("") }} disabled={coursesLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={coursesLoading ? "กำลังโหลด..." : "เลือกคอร์ส"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>จำนวนวันเข้าถึง (เว้นว่าง = ใช้ค่าเริ่มต้นของคอร์ส)</Label>
            <Input
              type="number"
              min={1}
              placeholder="เช่น 90"
              value={accessDurationDays}
              onChange={(e) => setAccessDurationDays(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "เพิ่มสิทธิ์เข้าถึง"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
