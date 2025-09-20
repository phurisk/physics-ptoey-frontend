import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL?.trim()
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured", data: [] },
      { status: 500 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const url = new URL(req.url)
    const query = url.searchParams.toString()
    const upstreamUrl = `${baseUrl}/api/ebooks${query ? `?${query}` : ""}`

    const res = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { cookie },
    })
    const text = await res.text()
    let parsed: any = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch (err) {
      console.error("Failed to parse upstream ebooks response", err)
    }

    const mediaBase = process.env.NEXT_PUBLIC_ELEARNING_BASE_URL?.trim().replace(/\/$/, "") || baseUrl

    const toAbsolute = (input?: string | null) => {
      if (!input) return null
      const trimmed = input.trim()
      if (!trimmed) return null
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      if (trimmed.startsWith("/")) return `${mediaBase}${trimmed}`
      return `${mediaBase}/${trimmed}`
    }

    const normalizeCover = (entry: any) => {
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

    const normalized = (() => {
      if (Array.isArray(parsed?.data)) {
        parsed.data = parsed.data.map((item: any) => normalizeCover({ ...item }))
        return parsed
      }
      if (parsed && typeof parsed === "object" && parsed.data && typeof parsed.data === "object") {
        parsed.data = normalizeCover({ ...parsed.data })
        return parsed
      }
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => normalizeCover({ ...item }))
      }
      return normalizeCover(parsed)
    })()

    if (!res.ok) {
      console.error("Upstream /api/ebooks error", {
        url: upstreamUrl,
        status: res.status,
        body: text,
      })
      if (normalized) {
        return NextResponse.json(normalized, { status: res.status })
      }
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch ebooks from upstream",
          status: res.status,
        },
        { status: res.status }
      )
    }

    return NextResponse.json(normalized ?? {}, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch ebooks", data: [] },
      { status: 502 }
    )
  }
}
