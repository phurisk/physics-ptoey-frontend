"use client"
import { useState, useEffect } from "react"
import { Coins, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { AdminUser } from "@/hooks/admin/useUsers"

export default function TokenModal({
  open,
  user,
  onCancel,
  onSubmit,
}: {
  open: boolean
  user: AdminUser | null
  onCancel: () => void
  onSubmit: (tokens: number) => Promise<void>
}) {
  const { toast } = useToast()
  const [fetching, setFetching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTokens, setCurrentTokens] = useState<number | null>(null)
  const [tokens, setTokens] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !user?.id) return

    setFetching(true)
    setError("")
    fetch(`/api/admin/users/${user.id}/practice-tokens`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCurrentTokens(data.data.tokens)
          setTokens(String(data.data.tokens))
        } else {
          toast({ variant: "destructive", title: data.error || "โหลดข้อมูล token ไม่สำเร็จ" })
        }
      })
      .catch(() => toast({ variant: "destructive", title: "เกิดข้อผิดพลาดในการโหลดข้อมูล token" }))
      .finally(() => setFetching(false))
  }, [open, user?.id, toast])

  const adjust = (delta: number) => {
    setTokens((prev) => String(Math.max(0, (Number(prev) || 0) + delta)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(tokens)
    if (!Number.isInteger(value) || value < 0) {
      setError("จำนวน token ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป")
      return
    }
    setError("")
    setLoading(true)
    try {
      await onSubmit(value)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            จัดการ Token ฝึกฝน
          </DialogTitle>
        </DialogHeader>

        <div className="-mt-2 mb-2 text-sm">
          <div className="font-semibold text-gray-900">{user.name || "ไม่ระบุชื่อ"}</div>
          <div className="text-gray-500">{user.email}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fetching ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังโหลดยอด token...
            </div>
          ) : (
            <>
              {currentTokens != null && (
                <p className="text-xs text-gray-500">
                  ยอดปัจจุบัน: <span className="font-semibold text-gray-700">{currentTokens}</span> token
                  (ใช้ร่วมกันได้ทุกข้อสอบจำลอง)
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="tokens">ยอด token</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => adjust(-10)}>
                    -10
                  </Button>
                  <Input
                    id="tokens"
                    type="number"
                    min={0}
                    value={tokens}
                    onChange={(e) => setTokens(e.target.value)}
                    className="text-center"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => adjust(10)}>
                    +10
                  </Button>
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <p className="text-xs text-gray-400">ตั้งเป็นยอดใหม่ทั้งหมด ไม่ใช่การบวกเพิ่มจากยอดเดิม</p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading || fetching}>
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
