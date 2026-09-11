export type OptionLabelStyle = "NUMBER" | "LETTER"

// Real Thai answer sheets almost always number the bubbles (1, 2, 3, 4), so
// that's the default — LETTER stays available per exam for question banks
// that were written assuming lettered choices (A, B, C, D).
export function optionLabelFor(index: number, style: OptionLabelStyle | undefined | null): string {
  if (style === "LETTER") return String.fromCharCode(65 + index)
  return String(index + 1)
}
