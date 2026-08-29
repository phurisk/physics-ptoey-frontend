"use client"

import { useEffect, useRef, useState } from "react"
import { Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Toggleable scratch pad for the exam-taking UI — plain freehand
 * working-out space, not saved anywhere. Short-answer questions keep a
 * normal <Input>/<Textarea> wherever they're displayed on the right; a
 * stylus (e.g. Apple Pencil Scribble on iPad) already converts handwriting
 * to text in any standard form field at the OS level, so that field doesn't
 * need to live in this pad or be handled specially here.
 */
export default function AnswerPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const drawingRef = useRef(false)
  const [, setCanvasReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      setCanvasReady(true)
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const ctx = canvas.getContext("2d")
    const { x, y } = getPos(e)
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.strokeStyle = "#2563eb"
    ctx.lineWidth = 2.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    drawingRef.current = false
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="flex h-full flex-col rounded-lg border">
      <div className="flex items-center justify-between border-b bg-gray-50 p-2.5">
        <div>
          <span className="text-sm font-semibold text-gray-900">กระดาษร่าง</span>
          <p className="text-xs text-gray-500">พื้นที่คิดเลข/ร่างคำตอบ</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={clearCanvas}>
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          ล้าง
        </Button>
      </div>

      <div ref={containerRef} className="relative flex-1 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        />
        <div className="pointer-events-none absolute bottom-2 left-2 text-xs text-gray-300">พื้นที่ร่าง/คิดเลข (ไม่ถูกบันทึก)</div>
      </div>
    </div>
  )
}
