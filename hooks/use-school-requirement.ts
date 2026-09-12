"use client"

import { useEffect, useState } from "react"
import http from "@/lib/http"

/**
 * Checkout (POST /api/orders) has always required a school name the first
 * time a user places an order — but no page ever collected one, so every
 * checkout for a user without a school on file failed with
 * "กรุณากรอกชื่อโรงเรียน" and no way to fix it. This checks once whether the
 * current user still needs to supply it, so the checkout form can show the
 * field only when it's actually required.
 */
export function useSchoolRequirement(isAuthenticated: boolean) {
  const [school, setSchool] = useState("")
  const [needsSchool, setNeedsSchool] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    if (!isAuthenticated) {
      setChecked(true)
      return
    }
    setChecked(false)
    http
      .get("/api/user/school")
      .then((res) => {
        if (active) setNeedsSchool(!res.data?.data?.school)
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

  return { school, setSchool, needsSchool, checked }
}
