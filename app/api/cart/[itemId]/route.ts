import { NextResponse } from "next/server"

function ensureBaseUrl() {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured")
  }
  return baseUrl.replace(/\/$/, "")
}

async function proxyCartRequest(req: Request, params: { itemId: string }, method: "PATCH" | "DELETE") {
  const baseUrl = ensureBaseUrl()
  const cookie = req.headers.get("cookie") ?? ""
  let body: any = undefined
  if (method === "PATCH" || method === "DELETE") {
    try {
      const json = await req.json()
      if (json && Object.keys(json).length > 0) body = json
    } catch {}
  }

  const headers: Record<string, string> = { cookie }
  if (body !== undefined) headers["content-type"] = "application/json"

  const attempt = async (url: string, payload: any) => {
    const res = await fetch(url, {
      method,
      headers,
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    })
    return res
  }

  const primary = await attempt(`${baseUrl}/api/cart/${encodeURIComponent(params.itemId)}`, body)
  if (primary.status !== 404 && primary.status !== 405) {
    const data = await primary.json().catch(() => ({}))
    return NextResponse.json(data, { status: primary.status })
  }

  const fallbackPayload = {
    ...(body && typeof body === "object" ? body : {}),
    cartItemId: params.itemId,
    itemId: params.itemId,
  }

  const fallbackUrl = body && typeof body === "object" && "cartId" in body
    ? `${baseUrl}/api/cart?cartId=${encodeURIComponent(String(body.cartId))}`
    : `${baseUrl}/api/cart`

  const fallback = await attempt(fallbackUrl, fallbackPayload)
  const data = await fallback.json().catch(() => ({}))
  return NextResponse.json(data, { status: fallback.status })
}

export async function PATCH(req: Request, ctx: { params: { itemId: string } }) {
  try {
    return await proxyCartRequest(req, ctx.params, "PATCH")
  } catch (error: any) {
    const message = error?.message || "Failed to adjust cart item"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: { itemId: string } }) {
  try {
    return await proxyCartRequest(req, ctx.params, "DELETE")
  } catch (error: any) {
    const message = error?.message || "Failed to remove cart item"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

