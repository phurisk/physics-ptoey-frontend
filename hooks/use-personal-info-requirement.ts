"use client"

import { useEffect, useState } from "react"
import http from "@/lib/http"

export type PersonalInfoValues = { school: string; phone: string; address: string }

/**
 * Checkout (POST /api/orders) has always required a school name, phone
 * number, and address the first time a user places an order — but no page
 * ever collected any of them, so checkout for a user missing any one of
 * these failed outright with no way to fix it. This checks once which of
 * the three the current user still needs to supply, so the checkout form
 * can show only the missing fields (and none at all for a returning user
 * who already has them on file).
 */
export function usePersonalInfoRequirement(isAuthenticated: boolean) {
  const [values, setValues] = useState<PersonalInfoValues>({ school: "", phone: "", address: "" })
  const [missing, setMissing] = useState<Record<keyof PersonalInfoValues, boolean>>({ school: false, phone: false, address: false })
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    if (!isAuthenticated) {
      setChecked(true)
      return
    }
    setChecked(false)
    http
      .get("/api/user/checkout-info")
      .then((res) => {
        if (!active) return
        const data = res.data?.data || {}
        setMissing({ school: !data.school, phone: !data.phone, address: !data.address })
      })
      .catch(() => {
        // Fail open — a broken check shouldn't be what blocks checkout.
      })
      .finally(() => {
        if (active) setChecked(true)
      })
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const needsAny = missing.school || missing.phone || missing.address

  const setValue = (key: keyof PersonalInfoValues, value: string) => setValues((v) => ({ ...v, [key]: value }))

  const LABELS: Record<keyof PersonalInfoValues, string> = { school: "ชื่อโรงเรียน", phone: "เบอร์โทรศัพท์", address: "ที่อยู่" }

  /** Returns an error message listing whichever required field is still
   *  blank, or null if everything needed is filled in. */
  const validate = (): string | null => {
    const blank = (Object.keys(missing) as (keyof PersonalInfoValues)[]).filter((k) => missing[k] && !values[k].trim())
    if (blank.length === 0) return null
    return `กรุณากรอก: ${blank.map((k) => LABELS[k]).join(", ")}`
  }

  return { values, setValue, missing, needsAny, checked, validate }
}
