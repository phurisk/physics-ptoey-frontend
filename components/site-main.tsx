"use client"

import type React from "react"
import { usePathname } from "next/navigation"

/**
 * Customer-facing pages get top padding to clear the fixed Navigation bar;
 * /admin pages render their own chrome and skip it.
 */
export function SiteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")
  return <main className={isAdmin ? undefined : "pt-16 lg:pt-20"}>{children}</main>
}
