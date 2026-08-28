"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/admin/dashboard"
  const accessDenied = searchParams.get("error") === "AccessDenied"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(accessDenied ? "บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล" : "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl })
    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setLoading(false)
      return
    }
    router.push(callbackUrl)
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-6"
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.04) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="mt-1 text-sm text-gray-500">Physics Ptoey Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              อีเมล
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
