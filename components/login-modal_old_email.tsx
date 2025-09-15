"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { SiLine } from "react-icons/si"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState<"line" | "email" | null>(null)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [tab, setTab] = useState<"login" | "register">("login")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", confirm: "" })
  const { login, register: registerFn, loginWithLine } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading("email")
    setError("")
    setSuccess("")
    try {
      const result = await login(formData.email, formData.password)
      if (!result.success) {
        setError(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        return
      }
      setSuccess("เข้าสู่ระบบสำเร็จ")
     
      setTimeout(() => {
        onClose()
        setSuccess("")
      }, 1000)
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
    } finally {
      setLoading(null)
    }
  }

  const handleLineLogin = async () => {
    if (loading) return
    try {
      setLoading("line")
      loginWithLine()
    } finally {
  
      setTimeout(() => setLoading(null), 5000)
    }
  }

 

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirm) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }
    if (registerData.password !== registerData.confirm) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }
    if (registerData.password.length < 6) {
      setError("รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร")
      return
    }
    setLoading("email")
    setError("")
    setSuccess("")
    try {
      const result = await registerFn({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        confirmPassword: registerData.confirm,
      })
      if (!result.success) {
        setError(result.error || "สมัครใช้งานไม่สำเร็จ")
        return
      }
      
      setSuccess("สมัครใช้งานสำเร็จ")
      setTimeout(() => {
        onClose()
        setSuccess("")
      }, 1000)
      setRegisterData({ name: "", email: "", password: "", confirm: "" })
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครใช้งาน")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          sm:max-w-[480px]
          rounded-xl
          border border-gray-200
          bg-white
          shadow-lg
          p-0 overflow-hidden
        "
      >
        {/* Accessible description for the dialog to avoid a11y warning */}
        <DialogDescription className="sr-only">
          กล่องโต้ตอบสำหรับเข้าสู่ระบบหรือสมัครสมาชิกด้วยอีเมลหรือ LINE
        </DialogDescription>
        <DialogHeader className="px-6 pt-6 pb-3 text-center">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center">
            {tab === "login" ? "เข้าสู่ระบบ" : "สมัครใช้งาน"}
          </DialogTitle>
          <div className="mt-3 flex justify-center">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full max-w-xs">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">สมัครใช้งาน</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

     
        <div className="px-6">
          <ul className="mx-auto mt-1 grid grid-cols-1 gap-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              บันทึกความคืบหน้าการเรียนอัตโนมัติ
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              ปลดล็อกแบบฝึกหัดและข้อสอบทั้งหมด
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              ซิงก์ได้ทุกอุปกรณ์
            </li>
          </ul>
        </div>


        <div className="px-6 pt-5 pb-6 space-y-3">
      
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setError(""); setSuccess("") }}>
            <TabsContent value="login" className="space-y-3">
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                      placeholder="รหัสผ่านของคุณ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      {showPassword ? "ซ่อน" : "แสดง"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading === "email"}
                  className="w-full py-3 rounded-lg bg-[linear-gradient(180deg,#4eb5ed_0%,#01579b)] hover:bg-[linear-gradient(180deg,#01579b,#00acc1)] text-white font-semibold"
                >
                  {loading === "email" ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> กำลังเข้าสู่ระบบ...</span>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>
              </form>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-500">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              <Button
                onClick={handleLineLogin}
                disabled={!!loading}
                className="
                  w-full py-3 rounded-lg
                  bg-[#06C755] hover:bg-[#05b84f]
                  text-white font-medium
                  shadow-sm transition-all
                  flex items-center justify-center gap-3
                  cursor-pointer
                "
              >
                {loading === "line" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SiLine className="h-6 w-6" />
                )}
                เข้าสู่ระบบด้วย LINE
              </Button>

              {/* Google login removed */}
            </TabsContent>

            <TabsContent value="register" className="space-y-3">
              <form onSubmit={handleEmailRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="เช่น สมชาย ใจดี"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
                  <input
                    type="password"
                    name="confirm"
                    value={registerData.confirm}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading === "email"}
                  className="w-full py-3 rounded-lg bg-[linear-gradient(180deg,#4eb5ed_0%,#01579b)] hover:bg-[linear-gradient(180deg,#01579b,#00acc1)] text-white font-semibold"
                >
                  {loading === "email" ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> กำลังสมัครใช้งาน...</span>
                  ) : (
                    "สมัครใช้งาน"
                  )}
                </Button>
              </form>

              <p className="pt-1 text-center text-xs text-gray-400">
                มีบัญชีอยู่แล้ว? {" "}
                <button type="button" className="underline underline-offset-2 hover:text-gray-600" onClick={() => setTab("login")}>เข้าสู่ระบบ</button>
              </p>
            </TabsContent>
          </Tabs>

          <p className="pt-1 text-center text-xs text-gray-400">
            โดยการใช้งาน คุณยอมรับ{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-gray-600">
              ข้อกำหนดการใช้งาน
            </a>{" "}
            และ{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-gray-600">
              นโยบายความเป็นส่วนตัว
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}


function LineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <path
        fill="#06C755"
        d="M18 4C9.716 4 3 9.63 3 16.58c0 4.02 2.318 7.56 5.87 9.77l-.62 4.63c-.06.47.44.82.86.6l5.15-2.67c1.16.24 2.37.37 3.74.37 8.284 0 15-5.63 15-12.58S26.284 4 18 4Z"
      />
      <path
        fill="#fff"
        d="M10.4 12.8h1.9v7.1h-1.9v-7.1Zm3.2 0h1.9v5.2h3.2v1.9h-5.1v-7.1Zm7.5 0h-3.8v7.1h1.9v-2.1h1.4c1.9 0 3.1-1.1 3.1-2.5 0-1.4-1.2-2.5-2.6-2.5Zm-.3 3.4h-1.6v-1.6h1.6c.5 0 .9.36.9.8 0 .44-.4.8-.9.8Zm2.9-3.4h1.9v5.2h3.2v1.9h-5.1v-7.1Z"
      />
    </svg>
  )
}

