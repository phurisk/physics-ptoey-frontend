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
      { success: false, message: "Missing order id" },
      { status: 400 }
    )
  }

  try {
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(id)}`, {
      headers: { cookie },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))

    // Frontend normalization: remove shipping fee and adjust totals for display only.
    const normalize = (o: any) => {
      if (!o || typeof o !== 'object') return o
      const subtotal = Number(o.subtotal || 0)
      const couponDiscount = Number(o.couponDiscount || 0)
      const tax = Number(o.tax || 0)
      o.shippingFee = 0
      o.total = Math.max(0, subtotal + tax - couponDiscount)
      if (o.shipping && typeof o.shipping === 'object') {
        o.shipping.shippingFee = 0
      }
      return o
    }

    if (data && typeof data === 'object' && data.data) {
      data.data = normalize(data.data)
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 502 }
    )
  }
}

export async function PATCH(
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
      { success: false, message: "Missing order id" },
      { status: 400 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 502 }
    )
  }
}
