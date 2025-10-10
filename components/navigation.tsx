"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoginModal from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"
import { useCart } from "@/components/cart-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { itemCount } = useCart()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = original }
    }
  }, [isOpen])

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
    setIsOpen(false)
  }

  const rawAvatarUrl =
    (user as any)?.image ||
    (user as any)?.avatarUrl ||
    (user as any)?.picture ||
    (user as any)?.profileImageUrl ||
    null

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [avatarChecked, setAvatarChecked] = useState(false)

  useEffect(() => {
    setAvatarChecked(false)
    if (!rawAvatarUrl || typeof rawAvatarUrl !== "string") {
      setAvatarSrc(null)
      setAvatarChecked(true)
      return
    }
    const img = new Image()
    img.onload = () => {
      setAvatarSrc(rawAvatarUrl)
      setAvatarChecked(true)
    }
    img.onerror = () => {
      setAvatarSrc(null)
      setAvatarChecked(true)
    }
    img.src = rawAvatarUrl
  }, [rawAvatarUrl])

  const displayName =
    (user as any)?.name ||
    (user as any)?.displayName ||
    (user as any)?.email ||
    "ผู้ใช้"
  const initial = String(displayName || "").trim().charAt(0).toUpperCase() || "U"

  const menuItems = [
    { href: "/", label: "หน้าแรก" },
    { href: "/courses", label: "คอร์สเรียน" },
    { href: "/student-works", label: "ผลงานนักเรียน" },
    { href: "/study-plans", label: "แผนการเรียน" },
    { href: "/about", label: "เกี่ยวกับเรา" },
    { href: "/exam-bank", label: "คลังข้อสอบ" },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white/90 backdrop-blur-sm"}`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <Link href="/" className="flex items-center pl-2">
              <img src="/new-logo.png" alt="Logo" className="h-16 lg:h-20" />
            </Link>

            <div className="hidden lg:flex items-center space-x-1 lg:pr-4 xl:pr-10">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 xl:px-4 py-2 text-sm xl:text-lg font-medium whitespace-nowrap transition-colors duration-200 ${pathname === item.href ? "text-[#004B7D] border-b-2 border-[#004B7D]" : "text-gray-700 hover:text-[#004B7D] "}`}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/cart"
                className="relative lg:ml-2 xl:ml-4 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-[#004B7D] hover:text-[#004B7D]"
                aria-label="ตะกร้าสินค้า"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[22px] rounded-full bg-[#004B7D] px-1.5 py-[2px] text-center text-xs font-semibold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {loading || isLoggingOut ? (
                <Button
                  disabled
                  className="lg:ml-3 xl:ml-5 px-3 py-4 xl:px-4 xl:py-6 bg-gray-200 text-gray-600 rounded-lg text-sm xl:text-base font-semibold cursor-not-allowed"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin " /> {isLoggingOut ? "กำลังออกจากระบบ…" : "กำลังเข้าสู่ระบบ…"}
                </Button>
              ) : !isAuthenticated ? (
                <Button
                  onClick={handleLoginClick}
                  className="lg:ml-3 xl:ml-5 px-3 py-4 xl:px-4 xl:py-6 bg-[linear-gradient(180deg,#4eb5ed_0%,#01579b)] hover:bg-[linear-gradient(180deg,#01579b,#00acc1)] text-white rounded-lg text-sm xl:text-base font-bold transition-colors duration-200 cursor-pointer"
                >
                  สมัครเรียนออนไลน์
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="lg:ml-2 xl:ml-4 inline-flex items-center gap-2 focus:outline-none">
                      <Avatar key={avatarSrc || "fallback"}>
                        {avatarSrc && avatarChecked ? (
                          <AvatarImage
                            src={avatarSrc}
                            alt={displayName}
                            onLoadingStatusChange={(s) => {
                              if (s === "error") setAvatarSrc(null)
                            }}
                          />
                        ) : (
                          <AvatarFallback className="bg-yellow-500 text-white">
                            {initial}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    <DropdownMenuLabel className="text-gray-700">
                      {displayName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem>โปรไฟล์</DropdownMenuItem>
                    </Link>
                    {isLoggingOut ? (
                      <DropdownMenuItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังออกจากระบบ…
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            setIsLoggingOut(true)
                            await logout()
                          } catch {} finally {
                            setIsLoggingOut(false)
                          }
                        }}
                        variant="destructive"
                      >
                        ออกจากระบบ
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <Button variant="ghost" size="sm" className="lg:hidden h-14 w-14 p-0" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="lg:hidden"
              >
                <div className="px-2 pt-2 pb-3 space-y-3 bg-white border-t border-gray-200 shadow-sm rounded-lg mb-4">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${pathname === item.href ? "text-[#004B7D] border-l-4 border-[#004B7D] bg-[#004B7D1A]" : "text-gray-700 hover:text-[#004B7D] hover:bg-[#004B7D1A]"}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-md bg-gray-100 px-4 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-200"
                  >
                    <span>ตะกร้าสินค้า</span>
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <ShoppingCart className="h-4 w-4" />
                      {itemCount}
                    </span>
                  </Link>

                  {loading || isLoggingOut ? (
                    <Button
                      disabled
                      className="w-full justify-center gap-2 rounded-lg bg-gray-200 text-gray-600 text-base font-medium py-3"
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isLoggingOut ? "กำลังออกจากระบบ…" : "กำลังเข้าสู่ระบบ…"}
                    </Button>
                  ) : !isAuthenticated ? (
                    <Button
                      onClick={handleLoginClick}
                      className="block w-full text-left px-3 py-0 rounded-md text-base font-medium bg-[linear-gradient(180deg,#4eb5ed_0%,#01579b)] text-white"
                    >
                      สมัครเรียนออนไลน์
                    </Button>
                  ) : (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar key={`m-${avatarSrc || "fallback"}`}>
                          {avatarSrc && avatarChecked ? (
                            <AvatarImage
                              src={avatarSrc}
                              alt={displayName}
                              onLoadingStatusChange={(s) => {
                                if (s === "error") setAvatarSrc(null)
                              }}
                            />
                          ) : (
                            <AvatarFallback className="bg-yellow-500 text-white">
                              {initial}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="text-sm font-medium text-gray-800">{displayName}</div>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#004B7D] hover:bg-[#004B7D1A]"
                      >
                        โปรไฟล์
                      </Link>
                      <Button
                        onClick={async () => {
                          try {
                            setIsLoggingOut(true)
                            await logout()
                          } catch {} finally {
                            setIsLoggingOut(false)
                            setIsOpen(false)
                          }
                        }}
                        variant="outline"
                        className="block w-full text-left border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังออกจากระบบ…
                          </>
                        ) : (
                          "ออกจากระบบ"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.button
            aria-label="ปิดเมนู"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          />
        )}
      </AnimatePresence>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  )
}
