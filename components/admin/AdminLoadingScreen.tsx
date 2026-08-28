import { Loader2 } from "lucide-react"

export default function AdminLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-500">กำลังโหลด...</p>
    </div>
  )
}
