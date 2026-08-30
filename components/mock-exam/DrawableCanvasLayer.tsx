"use client"

import { useEffect, useRef } from "react"
import { FreehandEngine, type DrawSettings } from "./freehand-engine"

export type DrawApi = {
  clear: () => void
  undo: () => void
  redo: () => void
  setSettings: (settings: DrawSettings) => void
}

/**
 * Transparent scratch-drawing canvas overlaid on one PDF page. Purely local,
 * client-side pen input for the student's own working-out — nothing here is
 * ever sent to the server or persisted.
 *
 * Tool settings are applied imperatively via the registered `DrawApi` (see
 * onRegister) rather than through reactive props, because the PDF viewer caches
 * each page's rendered output and never re-invokes this component after the
 * parent's toolbar state changes.
 */
export default function DrawableCanvasLayer({
  width,
  height,
  pageIndex,
  initialSettings,
  onRegister,
  onActivity,
}: {
  width: number
  height: number
  pageIndex: number
  initialSettings: DrawSettings
  onRegister: (pageIndex: number, api: DrawApi) => void
  /** Fired when this page is drawn on, so the toolbar's undo/redo knows which
   *  page the student was last working on. */
  onActivity?: (pageIndex: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<FreehandEngine | null>(null)
  const onActivityRef = useRef(onActivity)
  onActivityRef.current = onActivity
  const initialSettingsRef = useRef(initialSettings)
  initialSettingsRef.current = initialSettings

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new FreehandEngine(canvas, initialSettingsRef.current)
    engineRef.current = engine
    engine.onChange = () => onActivityRef.current?.(pageIndex)

    onRegister(pageIndex, {
      clear: () => engine.clear(),
      undo: () => engine.undo(),
      redo: () => engine.redo(),
      setSettings: (settings) => engine.setSettings(settings),
    })
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [pageIndex, onRegister])

  // The page box changes whenever the viewer re-fits or the user zooms; the
  // engine replays its strokes as vectors so they stay crisp and aligned.
  useEffect(() => {
    engineRef.current?.setSize(width, height)
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={(e) => engineRef.current?.pointerDown(e)}
      onPointerMove={(e) => engineRef.current?.pointerMove(e)}
      onPointerUp={(e) => engineRef.current?.pointerUp(e)}
      onPointerCancel={(e) => engineRef.current?.pointerUp(e)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        userSelect: "none",
        // The PDF viewer's own text/annotation layers use z-index: 1 and would
        // otherwise sit above this canvas and eat every pointer event even
        // though they're visually beneath it — this needs to outrank them.
        zIndex: 2,
      }}
    />
  )
}
