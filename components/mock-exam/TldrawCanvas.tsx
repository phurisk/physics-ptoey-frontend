"use client"

import { Tldraw, type Editor, type TLComponents } from "tldraw"
import "tldraw/tldraw.css"

/**
 * The tldraw canvas itself. Loaded only on the client (see TldrawPad) — tldraw
 * touches window/document during setup and cannot be server-rendered.
 *
 * No `persistenceKey` is given, so the drawing lives in memory only and is gone
 * when the student leaves the page. That is deliberate: this is scratch
 * working-out, never part of the submitted answer.
 */

// Trim the parts of the default UI that make no sense inside an exam: file and
// page management, sharing, debug tooling. The drawing tools, style panel,
// undo/redo and zoom controls all stay.
const COMPONENTS: TLComponents = {
  MainMenu: null,
  PageMenu: null,
  SharePanel: null,
  HelpMenu: null,
  DebugPanel: null,
  DebugMenu: null,
  NavigationPanel: null,
}

export default function TldrawCanvas() {
  const handleMount = (editor: Editor) => {
    // Open straight into the pen — the pad exists to be written on.
    editor.setCurrentTool("draw")
    editor.user.updateUserPreferences({ colorScheme: "light" })
  }

  return <Tldraw components={COMPONENTS} onMount={handleMount} />
}
