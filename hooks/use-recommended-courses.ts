import { useEffect, useState } from "react"

type CourseCategory = {
  id?: string
  name?: string | null
  description?: string | null
}

type CourseCounts = {
  enrollments?: number
  chapters?: number
}

type CourseInstructor = {
  id?: string
  name?: string | null
  email?: string | null
}

export type Course = {
  id: string
  title: string
  description?: string | null
  coverImageUrl?: string | null
  category?: CourseCategory | null
  price?: number
  discountPrice?: number | null
  isFree?: boolean
  isRecommended?: boolean
  duration?: string | number | null
  sampleVideo?: string | null
  status?: string | null
  instructor?: CourseInstructor | null
  coverPublicId?: string | null
  isPhysical?: boolean
  weight?: number | null
  dimensions?: string | null
  _count?: CourseCounts
}

function isRecommendedFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "1" || normalized === "true"
  }
  return false
}

export function useRecommendedCourses(categoryName: string) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams({ page: "1", limit: "200" })
        const response = await fetch(`/api/courses?${params.toString()}`, {
          cache: "no-store",
        })
        const payload = await response.json().catch(() => ({}))
        const list: Course[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : []

        const filtered = list.filter((course) => {
          const name = (course?.category?.name ?? "").trim()
          return name === categoryName && isRecommendedFlag((course as any)?.isRecommended)
        })

        if (!cancelled) setCourses(filtered)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [categoryName])

  return { courses, loading }
}

