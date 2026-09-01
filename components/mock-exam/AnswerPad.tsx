"use client"

import { useEffect, useRef, useState } from "react"
import { FreehandEngine, type DrawSettings } from "./freehand-engine"
import DrawToolbar, { DEFAULT_DRAW_SETTINGS } from "./DrawToolbar"

/**
 * Toggleable scratch pad for the exam-taking UI — plain freehand working-out
 * space, not saved anywhere. Short-answer questions keep a normal <Input>
 * wherever they're displayed on the right; a stylus (e.g. Apple Pencil
 * Scribble) already converts handwriting to text in any standard form field at
 * the OS level, so that field doesn't need to live in this pad.
 *
 * The pad starts in "hand" mode so a swipe over it still scrolls the page;
 * picking a tool from the toolbar is what turns drawing on.
 */
export default function AnswerPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<FreehandEngine | null>(null)
  const [settings, setSettings] = useState<DrawSettings>(DEFAULT_DRAW_SETTINGS)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const engine = new FreehandEngine(canvas, settingsRef.current)
    engineRef.current = engine

    const resize = () => engine.setSize(container.clientWidth, container.clientHeight)
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => {
      observer.disconnect()
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setSettings(settings)
  }, [settings])

  return (
    <div className="flex h-full select-none flex-col rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gray-50 p-2.5">
        <div>
          <span className="text-sm font-semibold text-gray-900">กระดาษร่าง</span>
          <p className="text-xs text-gray-500">พื้นที่คิดเลข/ร่างคำตอบ</p>
        </div>
        <DrawToolbar
          settings={settings}
          onChange={setSettings}
          onUndo={() => engineRef.current?.undo()}
          onRedo={() => engineRef.current?.redo()}
          onClear={() => engineRef.current?.clear()}
        />
      </div>

      <div ref={containerRef} className="relative flex-1 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => engineRef.current?.pointerDown(e)}
          onPointerMove={(e) => engineRef.current?.pointerMove(e)}
          onPointerUp={(e) => engineRef.current?.pointerUp(e)}
          onPointerCancel={(e) => engineRef.current?.pointerUp(e)}
          // The compatibility mouse events are what actually start a text-selection
          // drag; cancelling pointerdown alone does not stop them in every browser.
          onMouseDown={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute bottom-2 left-2 text-xs text-gray-300">
          {settings.tool === "hand" ? "เลือกปากกาเพื่อเริ่มเขียน" : "พื้นที่ร่าง/คิดเลข (ไม่ถูกบันทึก)"}
        </div>
      </div>
    </div>
  )
}
