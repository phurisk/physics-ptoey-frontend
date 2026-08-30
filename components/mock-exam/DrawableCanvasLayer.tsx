"use client"

import { useEffect, useRef } from "react"

export type DrawApi = { clear: () => void; setPenEnabled: (enabled: boolean) => void }

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

  const applyPenStyle = (canvas: HTMLCanvasElement, enabled: boolean) => {
    canvas.style.pointerEvents = enabled ? "auto" : "none"
    canvas.style.touchAction = enabled ? "none" : "auto"
    canvas.style.cursor = enabled ? "crosshair" : "default"
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    applyPenStyle(canvas, penEnabledRef.current)
    onRegister(pageIndex, {
      clear: () => {
        const ctx = canvas.getContext("2d")
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      },
      setPenEnabled: (enabled: boolean) => {
        penEnabledRef.current = enabled
        applyPenStyle(canvas, enabled)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, onRegister])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabledRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabledRef.current || !drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.strokeStyle = "#dc2626"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handlePointerUp = () => {
    drawingRef.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        // The PDF viewer's own text/annotation layers use z-index: 1 and
        // would otherwise sit above this canvas and eat every pointer event
        // even though they're visually beneath it — this needs to outrank them.
        zIndex: 2,
      }}
    />
  )
}
