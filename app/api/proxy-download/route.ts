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

    const headers: Record<string, string> = {
      "content-type": upstream.headers.get("content-type") || "application/octet-stream",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
    }
    for (const h of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const v = upstream.headers.get(h)
      if (v) headers[h] = v
    }

    const status = upstream.status === 206 ? 206 : 200
    const body = upstream.body ?? (await upstream.arrayBuffer())
    return new NextResponse(body as any, { status, headers })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to proxy download" },
      { status: 500 }
    )
  }
}
