"use client"

import { useEffect, useRef } from "react"

export type DrawApi = { clear: () => void; setPenEnabled: (enabled: boolean) => void }

const STROKE_COLOR = "#dc2626"
const STROKE_WIDTH = 2

type Point = { x: number; y: number }

/**
 * Transparent scratch-drawing canvas overlaid on one PDF page. Purely local,
 * client-side pen input for the student's own working-out — nothing here is
 * ever sent to the server or persisted.
 *
 * The pen on/off toggle is applied imperatively via the registered `DrawApi`
 * (see onRegister) rather than through a reactive `penEnabled` prop, because
 * the PDF viewer library may cache each page's rendered output and never
 * re-invoke this component after the parent's toggle state changes.
 */
export default function DrawableCanvasLayer({
  width,
  height,
  pageIndex,
  initialPenEnabled,
  onRegister,
}: {
  width: number
  height: number
  pageIndex: number
  initialPenEnabled: boolean
  onRegister: (pageIndex: number, api: DrawApi) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const penEnabledRef = useRef(initialPenEnabled)
  const lastPointRef = useRef<Point | null>(null)
  const lastMidRef = useRef<Point | null>(null)

  const applyPenStyle = (canvas: HTMLCanvasElement, enabled: boolean) => {
    canvas.style.pointerEvents = enabled ? "auto" : "none"
    canvas.style.touchAction = enabled ? "none" : "auto"
    canvas.style.cursor = enabled ? "crosshair" : "default"
  }

  // Size the backing store to the device pixel ratio (crisp lines instead of
  // soft/jagged ones on retina screens and tablets). The page can change size
  // when the viewer re-fits to width, so rescale existing marks rather than
  // dropping the student's working-out.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !width || !height) return
    const dpr = window.devicePixelRatio || 1
    const nextW = Math.round(width * dpr)
    const nextH = Math.round(height * dpr)
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

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (snapshot) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, nextW, nextH)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = STROKE_COLOR
    ctx.fillStyle = STROKE_COLOR
    ctx.lineWidth = STROKE_WIDTH
  }, [width, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    applyPenStyle(canvas, penEnabledRef.current)
    onRegister(pageIndex, {
      clear: () => {
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      },
      setPenEnabled: (enabled: boolean) => {
        penEnabledRef.current = enabled
        applyPenStyle(canvas, enabled)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, onRegister])

  const pointFrom = (e: { clientX: number; clientY: number }): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabledRef.current) return
    // Without this the browser starts a text-selection drag over the PDF's
    // text layer, which highlights the page while drawing.
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = pointFrom(e)
    lastPointRef.current = p
    lastMidRef.current = p

    ctx.beginPath()
    ctx.arc(p.x, p.y, STROKE_WIDTH / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabledRef.current || !drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return

    // Replay every coalesced position so fast strokes stay curved instead of
    // turning into one straight chord per animation frame.
    const native = e.nativeEvent
    const coalesced = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : []
    const points = coalesced.length > 0 ? coalesced : [native]

    for (const ev of points) {
      const point = pointFrom(ev)
      const lastPoint = lastPointRef.current
      const lastMid = lastMidRef.current
      if (!lastPoint || !lastMid) continue

      const mid = { x: (lastPoint.x + point.x) / 2, y: (lastPoint.y + point.y) / 2 }
      // Stroke only the newest segment, as a quadratic through the midpoints.
      // The old code re-stroked one ever-growing path on every move, which got
      // progressively slower and visibly darker/thicker as a stroke went on.
      ctx.beginPath()
      ctx.moveTo(lastMid.x, lastMid.y)
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, mid.x, mid.y)
      ctx.stroke()

      lastPointRef.current = point
      lastMidRef.current = mid
    }
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
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

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        userSelect: "none",
        // The PDF viewer's own text/annotation layers use z-index: 1 and
        // would otherwise sit above this canvas and eat every pointer event
        // even though they're visually beneath it — this needs to outrank them.
        zIndex: 2,
      }}
    />
  )
}
