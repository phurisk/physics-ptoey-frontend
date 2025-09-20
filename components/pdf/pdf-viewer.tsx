"use client"
import { Worker, Viewer } from "@react-pdf-viewer/core"
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"
import { Loader2 } from "lucide-react"
import clsx from "clsx"

import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"

type PdfViewerProps = {
  fileUrl: string
  className?: string
}

const PDF_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"

export function PdfViewer({ fileUrl, className }: PdfViewerProps) {
  const layoutPlugin = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [defaultTabs[0]],
    renderToolbar: () => <div className="hidden" />,
  })

  return (
    <div className={clsx("h-full", className)}>
      <Worker workerUrl={PDF_WORKER_URL}>
        <div className="h-full">
          <Viewer
            fileUrl={fileUrl}
            plugins={[layoutPlugin]}
            renderLoader={() => (
              <div className="flex h-full items-center justify-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>กำลังโหลด...</span>
              </div>
            )}
            theme="light"
          />
        </div>
      </Worker>
    </div>
  )
}

export default PdfViewer
