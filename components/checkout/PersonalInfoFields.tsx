"use client"

import { Input } from "@/components/ui/input"
import type { PersonalInfoValues } from "@/hooks/use-personal-info-requirement"

/**
 * Renders only whichever of school/phone/address the checkout page's
 * usePersonalInfoRequirement says is still missing for the current user —
 * nothing at all for a returning user who already has all three on file.
 */
export default function PersonalInfoFields({
  values,
  missing,
  onChange,
  error,
  title = "ข้อมูลส่วนตัว (กรอกครั้งแรกเท่านั้น)",
}: {
  values: PersonalInfoValues
  missing: Record<keyof PersonalInfoValues, boolean>
  onChange: (key: keyof PersonalInfoValues, value: string) => void
  error?: string | null
  title?: string
}) {
  if (!missing.school && !missing.phone && !missing.address) return null

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      {missing.phone && <Input placeholder="เบอร์โทรศัพท์" value={values.phone} onChange={(e) => onChange("phone", e.target.value)} />}
      {missing.address && <Input placeholder="ที่อยู่" value={values.address} onChange={(e) => onChange("address", e.target.value)} />}
      {missing.school && <Input placeholder="ชื่อโรงเรียน" value={values.school} onChange={(e) => onChange("school", e.target.value)} />}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  )
}
