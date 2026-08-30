"use client"

import { Eraser, Hand, Highlighter, Pencil, Redo2, Trash2, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  HIGHLIGHTER_COLORS,
  PEN_COLORS,
  type DrawSettings,
  type SizeKey,
  type Tool,
} from "./freehand-engine"

export const DEFAULT_DRAW_SETTINGS: DrawSettings = {
  tool: "hand",
  penColor: PEN_COLORS[1],
  highlighterColor: HIGHLIGHTER_COLORS[0],
  size: "m",
}

const TOOLS: { tool: Tool; label: string; Icon: typeof Pencil }[] = [
  { tool: "hand", label: "เลื่อน/ไม่เขียน", Icon: Hand },
  { tool: "pen", label: "ปากกา", Icon: Pencil },
  { tool: "highlighter", label: "ปากกาเน้นข้อความ", Icon: Highlighter },
  { tool: "eraser", label: "ยางลบ", Icon: Eraser },
]

const SIZES: { size: SizeKey; label: string; dot: number }[] = [
  { size: "s", label: "เส้นเล็ก", dot: 4 },
  { size: "m", label: "เส้นกลาง", dot: 7 },
  { size: "l", label: "เส้นใหญ่", dot: 11 },
]

function IconButton({
  active,
  title,
  onClick,
  disabled,
  children,
}: {
  active?: boolean
  title: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border text-gray-600 transition",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {children}
    </button>
  )
}

/**
 * Tool palette shared by the scratch pad and the PDF exam overlay: tool
 * (hand/pen/highlighter/eraser), ink colour, stroke width, undo/redo, clear.
 * Colour swatches follow the active tool, so the highlighter offers its own
 * translucent set instead of the pen's.
 */
export default function DrawToolbar({
  settings,
  onChange,
  onUndo,
  onRedo,
  onClear,
  className,
}: {
  settings: DrawSettings
  onChange: (settings: DrawSettings) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  className?: string
}) {
  const colors = settings.tool === "highlighter" ? HIGHLIGHTER_COLORS : PEN_COLORS
  const activeColor = settings.tool === "highlighter" ? settings.highlighterColor : settings.penColor
  const showInk = settings.tool === "pen" || settings.tool === "highlighter"

  const pickColor = (color: string) =>
    onChange(settings.tool === "highlighter" ? { ...settings, highlighterColor: color } : { ...settings, penColor: color })

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <div className="flex items-center gap-1">
        {TOOLS.map(({ tool, label, Icon }) => (
          <IconButton key={tool} title={label} active={settings.tool === tool} onClick={() => onChange({ ...settings, tool })}>
            <Icon className="h-4 w-4" />
          </IconButton>
        ))}
      </div>

      {showInk && (
        <>
          <span className="mx-0.5 h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-1">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title="เลือกสี"
                aria-label={`สี ${color}`}
                aria-pressed={activeColor === color}
                onClick={() => pickColor(color)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition",
                  activeColor === color ? "border-gray-900 scale-110" : "border-white ring-1 ring-gray-200"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <span className="mx-0.5 h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-1">
            {SIZES.map(({ size, label, dot }) => (
              <IconButton key={size} title={label} active={settings.size === size} onClick={() => onChange({ ...settings, size })}>
                <span className="rounded-full bg-current" style={{ width: dot, height: dot }} />
              </IconButton>
            ))}
          </div>
        </>
      )}

      <span className="mx-0.5 h-6 w-px bg-gray-200" />
      <div className="flex items-center gap-1">
        <IconButton title="ย้อนกลับ" onClick={onUndo}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton title="ทำซ้ำ" onClick={onRedo}>
          <Redo2 className="h-4 w-4" />
        </IconButton>
        <IconButton title="ล้างทั้งหมด" onClick={onClear}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  )
}
