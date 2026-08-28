export function formatInterval(days: number): string {
  if (days < 1) return "น้อยกว่า 1 วัน"
  if (days < 30) return `${days} วัน`
  return `${Math.round(days / 30)} เดือน`
}
