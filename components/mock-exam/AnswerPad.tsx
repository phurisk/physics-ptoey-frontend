"use client"

import { useEffect, useRef, useState } from "react"
import { Eraser, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

const STROKE_COLOR = "#2563eb"
const STROKE_WIDTH = 2.2

type Point = { x: number; y: number }

/**
 * Toggleable scratch pad for the exam-taking UI — plain freehand
 * working-out space, not saved anywhere. Short-answer questions keep a
 * normal <Input>/<Textarea> wherever they're displayed on the right; a
 * stylus (e.g. Apple Pencil Scribble on iPad) already converts handwriting
 * to text in any standard form field at the OS level, so that field doesn't
 * need to live in this pad or be handled specially here.
 *
 * Drawing is off by default so the page still scrolls normally when a swipe
 * starts over the pad — the same pen-toggle pattern as the PDF exam view.
 */
export default function AnswerPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const lastMidRef = useRef<Point | null>(null)
  const [penEnabled, setPenEnabled] = useState(false)

  // Size the backing store to the device pixel ratio so lines are crisp on
  // retina screens/tablets instead of soft and jagged, and keep whatever is
  // already drawn when the pad is resized.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (!w || !h) return
      const dpr = window.devicePixelRatio || 1
      const nextW = Math.round(w * dpr)
      const nextH = Math.round(h * dpr)
      if (canvas.width === nextW && canvas.height === nextH) return

      let snapshot: HTMLCanvasElement | null = null
      if (canvas.width > 0 && canvas.height > 0) {
        snapshot = document.createElement("canvas")
        snapshot.width = canvas.width
        snapshot.height = canvas.height
        snapshot.getContext("2d")?.drawImage(canvas, 0, 0)
      }

      canvas.width = nextW
      canvas.height = nextH
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      if (snapshot) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(snapshot, 0, 0)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = STROKE_COLOR
      ctx.fillStyle = STROKE_COLOR
      ctx.lineWidth = STROKE_WIDTH
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const pointFrom = (e: { clientX: number; clientY: number }): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabled) return
    // Without this the browser starts a text-selection drag, which is what
    // highlights the surrounding page while drawing.
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = pointFrom(e)
    lastPointRef.current = p
    lastMidRef.current = p

    // A tap without movement should still leave a dot.
    ctx.beginPath()
    ctx.arc(p.x, p.y, STROKE_WIDTH / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabled || !drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return

    // A stylus / high-refresh pointer reports several positions per frame;
    // replaying all of them keeps fast strokes from collapsing into long
    // straight chords between frames.
    const native = e.nativeEvent
    const coalesced = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : []
    const points = coalesced.length > 0 ? coalesced : [native]

    for (const ev of points) {
      const point = pointFrom(ev)
      const lastPoint = lastPointRef.current
      const lastMid = lastMidRef.current
      if (!lastPoint || !lastMid) continue

      const mid = { x: (lastPoint.x + point.x) / 2, y: (lastPoint.y + point.y) / 2 }
      // Quadratic through midpoints gives a smooth curve instead of the
      // visible corners of straight lineTo segments — and only the newest
      // segment is stroked. (Re-stroking one long accumulated path on every
      // move is what made strokes get slower and darker the longer they got.)
      ctx.beginPath()
      ctx.moveTo(lastMid.x, lastMid.y)
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, mid.x, mid.y)
      ctx.stroke()

      lastPointRef.current = point
      lastMidRef.current = mid
    }
  }

  const stopDrawing = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    // Close the gap between the last midpoint and where the pointer actually
    // stopped, so strokes don't end slightly short.
    const ctx = canvasRef.current?.getContext("2d")
    const lastPoint = lastPointRef.current
    const lastMid = lastMidRef.current
    if (ctx && lastPoint && lastMid) {
      ctx.beginPath()
      ctx.moveTo(lastMid.x, lastMid.y)
      ctx.lineTo(lastPoint.x, lastPoint.y)
      ctx.stroke()
    }
    lastPointRef.current = null
    lastMidRef.current = null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  return (
    <div className="flex h-full select-none flex-col rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b bg-gray-50 p-2.5">
        <div>
          <span className="text-sm font-semibold text-gray-900">กระดาษร่าง</span>
          <p className="text-xs text-gray-500">พื้นที่คิดเลข/ร่างคำตอบ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={penEnabled ? "default" : "outline"} onClick={() => setPenEnabled((v) => !v)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            เขียน
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={clearCanvas}>
            <Eraser className="mr-1.5 h-3.5 w-3.5" />
            ล้าง
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute inset-0"
          style={{
            // Only capture input (and lock out touch scrolling) while the pen
            // is on — otherwise swipes over the pad scroll the page as usual.
            pointerEvents: penEnabled ? "auto" : "none",
            touchAction: penEnabled ? "none" : "auto",
            cursor: penEnabled ? "crosshair" : "default",
          }}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 text-xs text-gray-300">
          {penEnabled ? "พื้นที่ร่าง/คิดเลข (ไม่ถูกบันทึก)" : "กด “เขียน” เพื่อเริ่มร่าง"}
        </div>
      </div>
    </div>
  )
}
