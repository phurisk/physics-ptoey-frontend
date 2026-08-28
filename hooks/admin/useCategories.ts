"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"

export type AdminCategory = {
  id: string
  name: string
  description?: string | null
  _count?: { courses: number }
}

/**
 * Categories are a small, unpaginated resource — the GET /api/admin/categories
 * endpoint returns the full list, so filtering happens client-side here
 * instead of pulling in useAdminListState's server-pagination machinery.
 */
export function useCategories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState("")

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ")
      setCategories(data.data || [])
    } catch (error) {
      toast({ variant: "destructive", title: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = useMemo(() => {
    if (!searchInput) return categories
    const q = searchInput.toLowerCase()
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)
    )
  }, [categories, searchInput])

  return {
    categories: filteredCategories,
    totalCount: categories.length,
    loading,
    searchInput,
    setSearchInput,
    fetchCategories,
  }
}
