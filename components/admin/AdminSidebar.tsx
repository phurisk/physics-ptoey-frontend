"use client"

import Link from "next/link"
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
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
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

export default function AdminSidebar({
  collapsed,
  pathname,
  onToggle,
}: {
  collapsed: boolean
  pathname: string
  onToggle: () => void
}) {
  return (
    <div className="relative flex h-full flex-col border-r border-gray-200 bg-white">
      <Link
        href="/"
        className={`flex min-h-16 shrink-0 items-center border-b border-gray-200 ${
          collapsed ? "justify-center px-0 py-3" : "justify-start px-6 py-3"
        }`}
      >
        <span className={collapsed ? "text-lg font-bold tracking-tight text-gray-900" : "text-sm font-bold leading-snug tracking-tight text-gray-900"}>
          {collapsed ? "P" : "Physics Ptoey Admin"}
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
        className="absolute top-[70px] -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
