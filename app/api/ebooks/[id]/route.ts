import { NextResponse, NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Missing ebook id" },
      { status: 400 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""
    const headers: Record<string, string> = {}
    if (cookie) headers["cookie"] = cookie
    if (authorization) headers["authorization"] = authorization

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/ebooks/${encodeURIComponent(id)}`, {
      headers,
      cache: "no-store",
    })
    const mediaBase = process.env.NEXT_PUBLIC_ELEARNING_BASE_URL?.trim().replace(/\/$/, "") || baseUrl

    const toAbsolute = (input?: string | null) => {
      if (!input) return null
      const trimmed = input.trim()
      if (!trimmed) return null
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      if (trimmed.startsWith("/")) return `${mediaBase}${trimmed}`
      return `${mediaBase}/${trimmed}`
    }

    const normalizeEntry = (entry: any) => {
      if (!entry || typeof entry !== "object") return entry
      const candidates = [
        entry.coverImageUrl,
        entry.cover_image_url,
        entry.coverImage,
        entry.cover_image,
        entry.coverImagePath,
        entry.cover_image_path,
      ]
      let resolved: string | null = null
      for (const value of candidates) {
        if (typeof value === "string" && value.trim()) {
          resolved = toAbsolute(value)
          if (resolved) break
        } else if (value && typeof value === "object") {
          const nested = typeof value.url === "string" ? value.url : typeof value.path === "string" ? value.path : null
          if (nested) {
            resolved = toAbsolute(nested)
            if (resolved) break
          }
        }
      }
      if (resolved) {
        entry.coverImageUrl = resolved
      }
      return entry
    }

    const normalizePayload = (payload: any) => {
      if (Array.isArray(payload?.data)) {
        return {
          ...payload,
          data: payload.data.map((item: any) => normalizeEntry({ ...item })),
        }
      }
      if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
        return {
          ...payload,
          data: normalizeEntry({ ...payload.data }),
        }
      }
      if (Array.isArray(payload)) {
        return payload.map((item) => normalizeEntry({ ...item }))
      }
      return normalizeEntry(payload)
    }

    const data = await res.json().catch(() => ({}))
    const normalized = normalizePayload(data)
    return NextResponse.json(normalized ?? {}, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch ebook" },
      { status: 502 }
    )
  }
}
