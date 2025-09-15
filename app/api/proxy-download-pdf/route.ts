import { NextRequest } from "next/server"

function sanitizeFilename(name: string) {

  return name.replace(/[\\\/\0\r\n"]/g, "_").slice(0, 180) || "download"
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileUrl = searchParams.get("url")
    const rawName = searchParams.get("filename") || "download"
    const filename = sanitizeFilename(rawName)

    if (!fileUrl) {
      return new Response("Missing url", { status: 400 })
    }

    const range = req.headers.get("range") || undefined
    const upstream = await fetch(fileUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: range ? { Range: range } : undefined,
    })

    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: upstream.status || 502 })
    }

    const headers = new Headers()

    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    )

    headers.set("Content-Type", "application/octet-stream")
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
    const acceptRanges = upstream.headers.get("accept-ranges") || "bytes"
    headers.set("Accept-Ranges", acceptRanges)

    const contentRange = upstream.headers.get("content-range")
    if (contentRange) headers.set("Content-Range", contentRange)

    const contentLength = upstream.headers.get("content-length")
    if (contentLength) headers.set("Content-Length", contentLength)

    const status = upstream.status === 206 ? 206 : 200

    return new Response(upstream.body, { status, headers })
  } catch {
    return new Response("Proxy error", { status: 500 })
  }
}

export async function HEAD(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileUrl = searchParams.get("url")
    const rawName = searchParams.get("filename") || "download"
    const filename = sanitizeFilename(rawName)

    if (!fileUrl) {
      return new Response(null, { status: 400 })
    }

    const range = req.headers.get("range") || undefined
    const upstream = await fetch(fileUrl, {
      method: "HEAD",
      cache: "no-store",
      redirect: "follow",
      headers: range ? { Range: range } : undefined,
    })

    const headers = new Headers()
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    )
    headers.set("Content-Type", "application/octet-stream")
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")

    const acceptRanges = upstream.headers.get("accept-ranges") || "bytes"
    headers.set("Accept-Ranges", acceptRanges)

    const contentRange = upstream.headers.get("content-range")
    if (contentRange) headers.set("Content-Range", contentRange)

    const contentLength = upstream.headers.get("content-length")
    if (contentLength) headers.set("Content-Length", contentLength)

    const status = upstream.status === 206 ? 206 : upstream.ok ? 200 : upstream.status || 502
    return new Response(null, { status, headers })
  } catch {
    return new Response(null, { status: 500 })
  }
}
