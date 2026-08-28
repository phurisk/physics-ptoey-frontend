"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  BookOpen,
  Tag,
  BookMarked,
  FolderOpen,
  FileText,
  Newspaper,
  Ticket,
  ShoppingCart,
  Star,
  Users,
  GraduationCap,
  FileQuestion,
  ListTree,
  Layers,
  Truck,
  KeyRound,
  LogOut,
  Loader2,
} from "lucide-react"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/admin/courses", label: "คอร์สเรียน", icon: BookOpen },
  { href: "/admin/enrollments", label: "การลงทะเบียนเรียน", icon: GraduationCap },
  { href: "/admin/categories", label: "หมวดหมู่คอร์ส", icon: Tag },
  { href: "/admin/ebooks", label: "อีบุ๊ก", icon: BookMarked },
  { href: "/admin/ebook-categories", label: "หมวดหมู่อีบุ๊ก", icon: FolderOpen },
  { href: "/admin/exam-bank", label: "คลังข้อสอบ (ไฟล์)", icon: FileText },
  { href: "/admin/exam-categories", label: "หมวดหมู่ข้อสอบ", icon: FolderOpen },
  { href: "/admin/exams", label: "ข้อสอบในคอร์ส", icon: FileText },
  { href: "/admin/mock-exams", label: "ข้อสอบจำลอง", icon: FileQuestion },
  { href: "/admin/mock-topics", label: "หัวข้อข้อสอบจำลอง", icon: ListTree },
  { href: "/admin/flashcard-decks", label: "แฟลชการ์ด", icon: Layers },
  { href: "/admin/posts", label: "บทความ", icon: Newspaper },
  { href: "/admin/post-types", label: "หมวดหมู่บทความ", icon: FolderOpen },
  { href: "/admin/coupons", label: "คูปอง", icon: Ticket },
  { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
  { href: "/admin/shipping", label: "การจัดส่ง", icon: Truck },
  { href: "/admin/reviews", label: "รีวิว", icon: Star },
  { href: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/admin/login")
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">Physics Ptoey Admin</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>จัดการระบบ</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname?.startsWith(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="truncate text-xs text-gray-500">{session?.user?.email}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild title="เปลี่ยนรหัสผ่าน">
                <Link href="/admin/change-password">
                  <KeyRound className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="ออกจากระบบ">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-4">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
