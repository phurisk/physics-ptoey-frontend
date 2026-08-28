/**
 * Builds a truncated page-number list for pagination UI, e.g. for 200 pages
 * with current=42: [1, "...", 41, 42, 43, "...", 200] — instead of
 * rendering every single page number, which overflows the page once the
 * total page count gets large.
 */
export function getPaginationRange(current: number, total: number, siblingCount = 1): (number | "...")[] {
  const totalNumbers = siblingCount * 2 + 5
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(current - siblingCount, 1)
  const rightSibling = Math.min(current + siblingCount, total)

  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < total - 1

  const range: (number | "...")[] = [1]

  if (showLeftEllipsis) range.push("...")
  for (let i = Math.max(leftSibling, 2); i <= Math.min(rightSibling, total - 1); i++) {
    range.push(i)
  }
  if (showRightEllipsis) range.push("...")

  if (total > 1) range.push(total)

  return range
}
