"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Home, KeyRound, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ChangePasswordModal from "./ChangePasswordModal"

type HeaderUser = { name?: string | null; email?: string | null } | null

export default function AdminHeader({
  onToggle,
  user,
  onLogout,
}: {
  onToggle: () => void
  user: HeaderUser
  onLogout: () => void
}) {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const displayName = user?.name || user?.email || "ผู้ดูแลระบบ"
  const initial = (user?.name || user?.email || "A").charAt(0).toUpperCase()

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
        <Button variant="ghost" size="icon" onClick={onToggle} aria-label="สลับเมนู">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild title="กลับสู่หน้าหลัก">
            <Link href="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-gray-50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-sm text-white">{initial}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-gray-700 sm:inline">{displayName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{displayName}</div>
                <div className="text-xs font-normal text-gray-500">ผู้ดูแลระบบ</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                แก้ไขรหัสผ่าน
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </>
  )
}
