"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import http from "@/lib/http"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"

export type CartItem = {
  id: string
  cartId?: string | null
  itemType: "COURSE" | "EBOOK" | string
  itemId: string
  title: string
  quantity: number
  unitPrice: number
  totalPrice?: number | null
  coverImageUrl?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

type NormalizedCart = {
  items: CartItem[]
  cartId: string | null
  itemCount: number
  subtotal: number
}

type CartState = {
  items: CartItem[]
  cartId: string | null
  itemCount: number
  loaded: boolean
  loading: boolean
  error: string | null
  subtotal: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  loading: boolean
  syncing: boolean
  error: string | null
  cartId: string | null
  subtotal: number
  refresh: () => Promise<void>
  addItem: (payload: {
    itemType: CartItem["itemType"]
    itemId: string
    title: string
    unitPrice: number
  }) => Promise<void>
  increase: (itemId: string) => Promise<void>
  decrease: (itemId: string) => Promise<void>
  remove: (payload: { cartItemId: string; itemId: string; itemType: CartItem["itemType"] }) => Promise<void>
  clearLocal: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const userId = (user as any)?.id ? String((user as any).id) : null
const { toast } = useToast()
  const [state, setState] = useState<CartState>({
    items: [],
    cartId: null,
    itemCount: 0,
    subtotal: 0,
    loaded: false,
    loading: false,
    error: null,
  })
  const [syncing, setSyncing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const resetState = useCallback(() => {
    setState({ items: [], cartId: null, itemCount: 0, subtotal: 0, loaded: false, loading: false, error: null })
    setSyncing(false)
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  const normalizePayload = useCallback((payload: any): NormalizedCart => {
    const unwrap = (data: any): any => {
      if (!data) return {}
      if (Array.isArray(data)) return { items: data }
      if (data.data && data !== data.data) return unwrap(data.data)
      if (data.cart) return unwrap(data.cart)
      return data
    }

    const raw = unwrap(payload)
    const items: CartItem[] = Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw)
      ? raw
      : []

    const cartId: string | null = raw?.id ?? raw?.cartId ?? (items[0]?.cartId ?? null)
    const subtotal = typeof raw?.subtotal === "number" ? raw.subtotal : items.reduce((sum, item) => sum + (Number(item.totalPrice ?? item.unitPrice ?? 0) * Number(item.quantity ?? 1)), 0)
    const itemCount = typeof raw?.itemCount === "number" ? raw.itemCount : items.reduce((sum, item) => sum + (Number(item.quantity ?? 1)), 0)

    const mapped = items
      .filter(Boolean)
      .map((item) => {
        const { id: _ignoredId, ...rest } = item
        const quantity = Math.max(1, Number(item.quantity ?? 1) || 1)
        const rawTotal = item.totalPrice != null ? Number(item.totalPrice) : undefined
        const rawUnit = item.unitPrice != null ? Number(item.unitPrice) : undefined
        const estimatedUnit = rawUnit != null && !Number.isNaN(rawUnit) ? rawUnit : rawTotal != null ? rawTotal / quantity : Number(item.price ?? 0) || 0

        return {
          ...rest,
          id: item.id || item.cartItemId || `${item.itemType || "ITEM"}-${item.itemId}`,
          cartId: item.cartId ?? cartId ?? null,
          itemType: String(item.itemType || raw?.itemType || "COURSE").toUpperCase(),
          itemId: item.itemId || item.courseId || item.ebookId || "",
          title: item.title || item.course?.title || item.ebook?.title || "สินค้า",
          quantity,
          unitPrice: estimatedUnit,
          totalPrice: rawTotal != null ? rawTotal : estimatedUnit * quantity,
          coverImageUrl: item.coverImageUrl || item.course?.coverImageUrl || item.ebook?.coverImageUrl || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }
      })

    return {
      items: mapped,
      cartId,
      itemCount,
      subtotal,
    }
  }, [])

  const fetchCart = useCallback(async () => {
    if (!userId) {
      resetState()
      return
    }
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const params = new URLSearchParams({ userId })
      const res = await http.get(`/api/cart?${params}`)
      const normalized = normalizePayload(res?.data)
      setState({
        items: normalized.items,
        cartId: normalized.cartId,
        itemCount: normalized.itemCount,
        subtotal: normalized.subtotal,
        loaded: true,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || "ไม่สามารถโหลดตะกร้าได้"
      setState((prev) => ({ ...prev, loading: false, error: message }))
    }
  }, [userId, resetState, normalizePayload])

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      resetState()
      return
    }
    void fetchCart()
  }, [isAuthenticated, userId, fetchCart, resetState])

  const syncQuantity = useCallback(
    async (itemId: string, direction: "increase" | "decrease") => {
      if (!userId) return
      try {
        setSyncing(true)
        const res = await http.patch(`/api/cart/${encodeURIComponent(itemId)}`, {
          userId,
          cartId: state.cartId || undefined,
          action: direction,
        })
        const normalized = normalizePayload(res?.data)
        if (normalized.items.length) {
          setState({
            items: normalized.items,
            cartId: normalized.cartId,
            itemCount: normalized.itemCount,
            subtotal: normalized.subtotal,
            loaded: true,
            loading: false,
            error: null,
          })
        } else {
          setState((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId
                ? { ...item, quantity: Math.max(1, direction === "increase" ? item.quantity + 1 : item.quantity - 1) }
                : item
            ),
          }))
        }
      } catch (error: any) {
        const message = error?.response?.data?.error || error?.message || "ปรับจำนวนสินค้าไม่สำเร็จ"
        toast({ variant: "destructive", title: "ไม่สำเร็จ", description: message })
        throw error
      } finally {
        setSyncing(false)
      }
    },
    [userId, toast, normalizePayload, state.cartId]
  )

  const removeItem = useCallback(
    async (target: { cartItemId: string; itemId: string; itemType: CartItem["itemType"] }) => {
      if (!userId) return
      try {
        setSyncing(true)
        let res
        try {
          res = await http.delete(`/api/cart`, {
            data: {
              userId,
              itemType: target.itemType,
              itemId: target.itemId,
            },
          })
        } catch (error: any) {
          const status = error?.response?.status
          if (status && ![404, 405].includes(Number(status))) throw error
          res = await http.delete(`/api/cart/${encodeURIComponent(target.cartItemId)}`, {
            data: { userId, cartId: state.cartId || undefined },
          })
        }
        const normalized = normalizePayload(res?.data)
        setState((prev) => {
          const prevItems = Array.isArray(prev.items) ? prev.items : []
          const removedItem = prevItems.find((item) => String(item.id) === String(target.cartItemId))
          const removedQuantity = removedItem?.quantity ?? 1
          const removedSubtotal = removedItem ? Number(removedItem.totalPrice ?? removedItem.unitPrice * removedItem.quantity) : 0

          const baseState: CartState = {
            items: prevItems,
            cartId: normalized.cartId ?? prev.cartId,
            itemCount: prev.itemCount,
            subtotal: prev.subtotal,
            loaded: true,
            loading: false,
            error: null,
          }

          if (normalized.items.length > 0) {
            return {
              ...baseState,
              items: normalized.items,
              itemCount: normalized.itemCount,
              subtotal: normalized.subtotal,
            }
          }

          const fallbackItems = prevItems.filter((item) => String(item.id) !== String(target.cartItemId))
          const fallbackCount = Math.max(0, (prev.itemCount || prevItems.reduce((sum, item) => sum + (item.quantity || 1), 0)) - removedQuantity)
          const fallbackSubtotal = Math.max(0, (prev.subtotal || prevItems.reduce((sum, item) => sum + Number(item.totalPrice ?? item.unitPrice * item.quantity), 0)) - removedSubtotal)

          if (normalized.itemCount === 0 && (fallbackItems.length === 0 || fallbackCount === 0)) {
            return {
              ...baseState,
              items: [],
              itemCount: 0,
              subtotal: 0,
            }
          }

          return {
            ...baseState,
            items: fallbackItems,
            itemCount: fallbackCount,
            subtotal: fallbackSubtotal,
          }
        })
        toast({ title: "ลบสินค้าแล้ว", description: "นำสินค้าออกจากตะกร้าเรียบร้อย" })
      } catch (error: any) {
        const message = error?.response?.data?.error || error?.message || "ลบสินค้าไม่สำเร็จ"
        toast({ variant: "destructive", title: "ไม่สำเร็จ", description: message })
        throw error
      } finally {
        setSyncing(false)
      }
    },
    [userId, toast, normalizePayload, state.cartId]
  )

  const addItem = useCallback(
    async ({ itemType, itemId, title, unitPrice }: { itemType: CartItem["itemType"]; itemId: string; title: string; unitPrice: number }) => {
      if (!userId) {
        toast({ variant: "destructive", title: "กรุณาเข้าสู่ระบบ", description: "เข้าสู่ระบบเพื่อใช้งานตะกร้า" })
        throw new Error("User not authenticated")
      }
      try {
        setSyncing(true)
        const res = await http.post(`/api/cart`, {
          userId,
          cartId: state.cartId || undefined,
          itemType,
          itemId,
          title,
          quantity: 1,
          unitPrice,
        })
        const normalized = normalizePayload(res?.data)
        if (normalized.items.length) {
          setState({
            items: normalized.items,
            cartId: normalized.cartId,
            itemCount: normalized.itemCount,
            subtotal: normalized.subtotal,
            loaded: true,
            loading: false,
            error: null,
          })
        } else {
          await fetchCart()
        }
        toast({ title: "เพิ่มลงตะกร้าแล้ว", description: title })
      } catch (error: any) {
        const message = error?.response?.data?.error || error?.message || "เพิ่มสินค้าไม่สำเร็จ"
        toast({ variant: "destructive", title: "ไม่สำเร็จ", description: message })
        throw error
      } finally {
        setSyncing(false)
      }
    },
    [userId, toast, fetchCart, normalizePayload, state.cartId]
  )

  const value = useMemo<CartContextValue>(() => ({
    items: state.items,
    itemCount: state.itemCount || state.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    loading: state.loading && !state.loaded,
    syncing,
    error: state.error,
    cartId: state.cartId,
    subtotal: state.subtotal,
    refresh: fetchCart,
    addItem,
    increase: (id: string) => syncQuantity(id, "increase"),
    decrease: (id: string) => syncQuantity(id, "decrease"),
    remove: removeItem,
    clearLocal: resetState,
  }), [state.items, state.itemCount, state.loading, state.loaded, state.error, syncing, state.cartId, state.subtotal, fetchCart, addItem, syncQuantity, removeItem, resetState])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider")
  }
  return ctx
}
