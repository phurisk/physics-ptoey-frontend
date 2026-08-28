type EnrollmentLike = {
  enrolledAt: Date
  accessDuration?: number | null
}

type CourseLike = {
  accessDuration?: number | null
}

const DEFAULT_ACCESS_DAYS = 60

/**
 * Single source of truth for course-access expiry: per-enrollment override,
 * else the course default, else a 60-day fallback.
 */
export function resolveEnrollmentAccess(enrollment: EnrollmentLike, course: CourseLike) {
  const accessDays = enrollment.accessDuration ?? course.accessDuration ?? DEFAULT_ACCESS_DAYS
  const expiresAt = new Date(enrollment.enrolledAt.getTime() + accessDays * 24 * 60 * 60 * 1000)
  const isExpire = new Date() > expiresAt

  return { expiresAt, isExpire }
}
