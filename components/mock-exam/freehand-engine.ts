import getStroke from "perfect-freehand"

/** "hand" = don't draw, just scroll/pan. A stylus still writes in hand mode. */
export type Tool = "hand" | "pen" | "highlighter" | "eraser"
export type SizeKey = "s" | "m" | "l"

export type DrawSettings = {
  tool: Tool
  penColor: string
  highlighterColor: string
  size: SizeKey
}

export const PEN_COLORS = ["#111827", "#2563eb", "#dc2626", "#16a34a"]
export const HIGHLIGHTER_COLORS = ["#fde047", "#86efac", "#f9a8d4", "#93c5fd"]

const SIZE_SCALE: Record<SizeKey, number> = { s: 0.6, m: 1, l: 1.9 }

type Pt = [number, number, number]

/** A finished stroke. Points are normalised (0..1) against the canvas box so a
 *  stroke can be re-rendered crisply at any size — PDF zoom, window resize. */
type Stroke = {
  pts: Pt[]
  color: string
  size: number
  thinning: number
  alpha: number
  composite: GlobalCompositeOperation
  simulatePressure: boolean
}

/**
 * Base stroke shape. `thinning` combined with pressure is what gives the
 * tapered "real ink" look of Notes on iPhone/iPad instead of a constant-width
 * line; `streamline` damps out the jitter of a fast finger or noisy digitiser.
 */
const BASE_SIZE = 4
const STROKE_OPTIONS = {
  smoothing: 0.6,
  streamline: 0.5,
  easing: (t: number) => Math.sin((t * Math.PI) / 2),
}

/** perfect-freehand returns an outline polygon; round its corners into a
 *  fillable path. Built as a Path2D (not an SVG string) to skip re-parsing. */
function outlineToPath(outline: number[][]): Path2D {
  const path = new Path2D()
  if (outline.length < 2) return path
  path.moveTo(outline[0][0], outline[0][1])
  for (let i = 0; i < outline.length; i++) {
    const [x0, y0] = outline[i]
    const [x1, y1] = outline[(i + 1) % outline.length]
    path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  path.closePath()
  return path
}

/**
 * Freehand drawing engine for a single <canvas>.
 *
 * Finished strokes are kept both as vectors (for undo/redo and for re-rendering
 * on resize) and flattened onto an offscreen bitmap, so a live stroke only
 * costs one drawImage plus one fill per frame no matter how much is drawn.
 *
 * Nothing here is persisted or sent anywhere — scratch working-out only.
 */
export class FreehandEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private committed: HTMLCanvasElement
  private strokes: Stroke[] = []
  private undone: Stroke[] = []
  private live: Pt[] = []
  private liveStyle: Omit<Stroke, "pts"> | null = null
  private drawing = false
  private pointerId: number | null = null
  private raf = 0
  private w = 0
  private h = 0
  private dpr = 1

  private settings: DrawSettings
  onChange?: () => void

  constructor(canvas: HTMLCanvasElement, settings: DrawSettings) {
    this.canvas = canvas
    this.settings = settings
    this.ctx = canvas.getContext("2d")!
    this.committed = document.createElement("canvas")
    this.applyStyle()
  }

  /** Resize the backing store to the CSS box times devicePixelRatio, then
   *  re-render every stroke at the new scale (vector replay, never a blurry
   *  bitmap upscale). */
  setSize(cssW: number, cssH: number) {
    if (!cssW || !cssH) return
    const dpr = window.devicePixelRatio || 1
    if (this.w === cssW && this.h === cssH && this.dpr === dpr) return
    this.w = cssW
    this.h = cssH
    this.dpr = dpr
    for (const c of [this.canvas, this.committed]) {
      c.width = Math.round(cssW * dpr)
      c.height = Math.round(cssH * dpr)
    }
    this.canvas.style.width = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
    this.renderCommitted()
    this.paint()
  }

  setSettings(settings: DrawSettings) {
    this.settings = settings
    this.applyStyle()
  }

  private applyStyle() {
    const drawMode = this.settings.tool !== "hand"
    // In hand mode touch must still scroll the page/PDF — and an actual stylus
    // keeps drawing anyway (the iPad behaviour: write with the Pencil, scroll
    // with a finger, no mode switch needed).
    this.canvas.style.touchAction = drawMode ? "none" : "auto"
    this.canvas.style.cursor = drawMode ? "crosshair" : "default"
  }

  /** Per-tool ink: highlighter is wide, flat-width, translucent and multiplied
   *  so text underneath stays readable; the eraser punches through instead. */
  private styleFor(tool: Exclude<Tool, "hand">, isStylus: boolean): Omit<Stroke, "pts"> {
    const scale = SIZE_SCALE[this.settings.size]
    const simulatePressure = !isStylus
    if (tool === "eraser") {
      return {
        color: "#000",
        size: 26 * scale,
        thinning: 0,
        alpha: 1,
        composite: "destination-out",
        simulatePressure: false,
      }
    }
    if (tool === "highlighter") {
      return {
        color: this.settings.highlighterColor,
        size: 20 * scale,
        thinning: 0,
        alpha: 0.4,
        composite: "multiply",
        simulatePressure: false,
      }
    }
    return {
      color: this.settings.penColor,
      size: BASE_SIZE * scale,
      thinning: 0.62,
      alpha: 1,
      composite: "source-over",
      simulatePressure,
    }
  }

  clear() {
    if (!this.strokes.length) return
    this.strokes = []
    this.undone = []
    this.live = []
    this.renderCommitted()
    this.paint()
    this.onChange?.()
  }

  undo() {
    const stroke = this.strokes.pop()
    if (!stroke) return
    this.undone.push(stroke)
    this.renderCommitted()
    this.paint()
    this.onChange?.()
  }

  redo() {
    const stroke = this.undone.pop()
    if (!stroke) return
    this.strokes.push(stroke)
    this.renderCommitted()
    this.paint()
    this.onChange?.()
  }

  private fill(ctx: CanvasRenderingContext2D, style: Omit<Stroke, "pts">, pts: Pt[], last: boolean) {
    const outline = getStroke(pts, {
      ...STROKE_OPTIONS,
      size: style.size,
      thinning: style.thinning,
      simulatePressure: style.simulatePressure,
      last,
    })
    if (outline.length < 2) return
    ctx.save()
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.globalCompositeOperation = style.composite
    ctx.globalAlpha = style.alpha
    ctx.fillStyle = style.color
    ctx.fill(outlineToPath(outline))
    ctx.restore()
  }

  private denorm(pts: Pt[]): Pt[] {
    return pts.map(([x, y, p]) => [x * this.w, y * this.h, p] as Pt)
  }

  private renderCommitted() {
    const ctx = this.committed.getContext("2d")
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.committed.width, this.committed.height)
    for (const s of this.strokes) this.fill(ctx, s, this.denorm(s.pts), true)
  }

  /** Composite: the finished-strokes bitmap, plus the in-progress stroke. */
  private paint = () => {
    this.raf = 0
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.committed.width) ctx.drawImage(this.committed, 0, 0)
    if (this.live.length && this.liveStyle) this.fill(ctx, this.liveStyle, this.live, false)
  }

  private schedule() {
    if (!this.raf) this.raf = requestAnimationFrame(this.paint)
  }

  private point(e: { clientX: number; clientY: number; pressure?: number }): Pt {
    const rect = this.canvas.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5]
  }

  pointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const isStylus = e.pointerType === "pen"
    // Hand mode: touch/mouse scroll, but a stylus can still write.
    const tool = this.settings.tool === "hand" ? (isStylus ? "pen" : null) : this.settings.tool
    if (!tool) return
    if (e.pointerType === "mouse" && e.buttons !== 1) return
    e.preventDefault()

    this.drawing = true
    this.pointerId = e.pointerId
    this.canvas.setPointerCapture(e.pointerId)
    // Stop the browser turning the drag into a text selection over whatever is
    // underneath — this is what used to highlight the whole screen.
    document.body.style.userSelect = "none"

    this.liveStyle = this.styleFor(tool, isStylus)
    this.live = [this.point(e)]
    this.schedule()
  }

  pointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!this.drawing || e.pointerId !== this.pointerId) return
    e.preventDefault()
    const native = e.nativeEvent
    // A stylus reports several positions per frame; replaying all of them is
    // what keeps a fast stroke curved instead of a chain of straight chords.
    const coalesced = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : []
    const events = coalesced.length ? coalesced : [native]
    for (const ev of events) this.live.push(this.point(ev))
    this.schedule()
  }

  pointerUp(e?: React.PointerEvent<HTMLCanvasElement>) {
    if (!this.drawing) return
    if (e && e.pointerId !== this.pointerId) return
    this.drawing = false
    this.pointerId = null
    document.body.style.userSelect = ""
    if (this.live.length && this.liveStyle) {
      const stroke: Stroke = {
        ...this.liveStyle,
        pts: this.live.map(([x, y, p]) => [x / this.w, y / this.h, p] as Pt),
      }
      this.strokes.push(stroke)
      // A new stroke ends the redo chain, as in any editor.
      this.undone = []
      const ctx = this.committed.getContext("2d")
      if (ctx) this.fill(ctx, stroke, this.live, true)
      this.live = []
      this.onChange?.()
    }
    this.paint()
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    document.body.style.userSelect = ""
  }
}
