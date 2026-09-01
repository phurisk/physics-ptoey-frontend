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
  smoothing: 0.55,
  // Keep this low: streamline pulls the rendered line towards the average of
  // recent points, so a high value makes the ink visibly trail behind the
  // cursor — which reads as laggy rather than smooth.
  streamline: 0.3,
  easing: (t: number) => Math.sin((t * Math.PI) / 2),
}

/** Above this many live points, flatten the front of the in-progress stroke
 *  onto the committed bitmap so re-tessellating it every frame stays cheap. */
const LIVE_FLUSH_AT = 320
const LIVE_FLUSH_OVERLAP = 12

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
  /** Points of the current stroke already baked into the committed bitmap. */
  private liveFlushed: Pt[] = []
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

    // A stroke must end even if the release never reaches the canvas — a
    // pointerup over another element, a dropped pointer capture, an alt-tab
    // mid-stroke. Without these the engine stays "held down": the browser keeps
    // extending a selection across the page and drawing can't resume.
    window.addEventListener("pointerup", this.endStroke)
    window.addEventListener("pointercancel", this.endStroke)
    window.addEventListener("blur", this.endStroke)
    document.addEventListener("selectstart", this.blockSelection)
    document.addEventListener("dragstart", this.blockSelection)
  }

  /** Suppress the browser's own drag-select while a stroke is in progress.
   *  preventDefault on pointerdown alone is not enough here: Safari and Chrome
   *  still start a text selection from the compatibility mouse events. */
  private blockSelection = (e: Event) => {
    if (this.drawing) e.preventDefault()
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
    // Taper only where real pressure exists (a stylus). Inferring pressure from
    // speed with a mouse or finger makes the width wobble on every small change
    // of pace, which looks unsteady rather than expressive — so those get an
    // even, predictable line instead.
    return {
      color: this.settings.penColor,
      size: BASE_SIZE * scale,
      thinning: isStylus ? 0.62 : 0,
      alpha: 1,
      composite: "source-over",
      simulatePressure: false,
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
    // Capture can be refused (an already-captured pointer, a detached node);
    // the window-level listeners above still end the stroke if it is.
    try {
      this.canvas.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    // Belt and braces against the drag-select: drop whatever the browser has
    // already selected, then lock selection off for the duration of the stroke.
    window.getSelection()?.removeAllRanges()
    document.body.style.userSelect = "none"

    this.liveStyle = this.styleFor(tool, isStylus)
    this.live = [this.point(e)]
    this.liveFlushed = []
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
    this.flushLiveIfLong()
    this.schedule()
  }

  /** Long strokes: bake all but the tail into the committed bitmap, so the
   *  per-frame cost of a stroke stays flat instead of creeping up the longer
   *  the student writes. Only safe for opaque source-over ink — a translucent
   *  highlighter would darken where the two halves overlap. */
  private flushLiveIfLong() {
    const style = this.liveStyle
    if (!style || this.live.length < LIVE_FLUSH_AT) return
    if (style.alpha !== 1 || style.composite !== "source-over") return
    const ctx = this.committed.getContext("2d")
    if (!ctx) return
    const head = this.live.slice(0, this.live.length - LIVE_FLUSH_OVERLAP)
    this.fill(ctx, style, head, false)
    this.liveFlushed.push(...head)
    this.live = this.live.slice(head.length)
  }

  pointerUp(e?: React.PointerEvent<HTMLCanvasElement>) {
    if (e && this.pointerId !== null && e.pointerId !== this.pointerId) return
    this.endStroke()
  }

  private endStroke = () => {
    if (!this.drawing) return
    this.drawing = false
    this.pointerId = null
    document.body.style.userSelect = ""
    const points = [...this.liveFlushed, ...this.live]
    if (points.length && this.liveStyle) {
      const stroke: Stroke = {
        ...this.liveStyle,
        pts: points.map(([x, y, p]) => [x / this.w, y / this.h, p] as Pt),
      }
      this.strokes.push(stroke)
      // A new stroke ends the redo chain, as in any editor.
      this.undone = []
      const ctx = this.committed.getContext("2d")
      if (ctx) this.fill(ctx, stroke, points, true)
      this.onChange?.()
    }
    this.live = []
    this.liveFlushed = []
    this.paint()
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    window.removeEventListener("pointerup", this.endStroke)
    window.removeEventListener("pointercancel", this.endStroke)
    window.removeEventListener("blur", this.endStroke)
    document.removeEventListener("selectstart", this.blockSelection)
    document.removeEventListener("dragstart", this.blockSelection)
    document.body.style.userSelect = ""
  }
}
