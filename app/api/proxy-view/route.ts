import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const target = url.searchParams.get("url")
    const filename = url.searchParams.get("filename") || "file.pdf"
    if (!target) {
      return NextResponse.json(
        { success: false, message: "Missing url parameter" },
        { status: 400 }
      )
    }

    // Support byte-range requests for better PDF viewing
    const range = req.headers.get("range") || undefined
    const upstream = await fetch(target, {
      headers: range ? { range } : undefined,
      cache: "no-store",
    })

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { success: false, message: `Upstream error: ${upstream.status}` },
        { status: 502 }
      )
    }

    // Determine content-type: force application/pdf when URL/filename looks like PDF
    const upstreamType = upstream.headers.get("content-type") || ""
    const looksPdf = /\.pdf(\?|$)/i.test(target) || /\.pdf(\?|$)/i.test(filename)
    const contentType = /application\/pdf/i.test(upstreamType)
      ? upstreamType
      : looksPdf
        ? "application/pdf"
        : (upstreamType || "application/pdf")

    // Prepare headers, keeping only what’s useful for the browser viewer
    const headers: Record<string, string> = {
      "content-type": contentType,
      "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
    }

    const passThrough = [
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ] as const

    for (const h of passThrough) {
      const v = upstream.headers.get(h)
      if (v) headers[h] = v
    }

    // Stream the response body to the client; support 206 when provided
    const status = upstream.status === 206 ? 206 : 200
    const body = upstream.body ?? (await upstream.arrayBuffer())

    return new NextResponse(body as any, {
      status,
      headers,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to proxy view" },
      { status: 500 }
    )
  }
}
