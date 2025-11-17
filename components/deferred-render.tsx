"use client"

import { useEffect, useRef, useState } from "react"

type DeferredRenderProps = {
  children: () => React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
}

export default function DeferredRender({
  children,
  fallback = null,
  rootMargin = "0px 0px 200px 0px",
}: DeferredRenderProps) {
  const [visible, setVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!wrapperRef.current || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin }
    )

    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [rootMargin, visible])

  return <div ref={wrapperRef}>{visible ? children() : fallback}</div>
}
