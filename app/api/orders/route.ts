import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured", data: [] },
      { status: 500 }
    )
  }

  try {
    const url = new URL(req.url)
    const search = url.search || ""
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/orders${search}`, {
      headers: { cookie },
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))

    const normalize = (o: any) => {
      if (!o || typeof o !== 'object') return o
      const subtotal = Number(o.subtotal || 0)
      const couponDiscount = Number(o.couponDiscount || 0)
      const tax = Number(o.tax || 0)
      // Ignore shippingFee 
      o.shippingFee = 0
      o.total = Math.max(0, subtotal + tax - couponDiscount)
      if (o.shipping && typeof o.shipping === 'object') {
        o.shipping.shippingFee = 0
      }
      return o
    }

    if (Array.isArray(data?.data)) {
      data.data = data.data.map(normalize)
    } else if (data && typeof data === 'object' && data.data && !Array.isArray(data.data)) {
      data.data = normalize(data.data)
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders", data: [] },
      { status: 502 }
    )
  }
}

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const cookie = req.headers.get("cookie") ?? ""
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    // When creating, the backend returns a minimal payload; recalc total if present
    if (data && typeof data === 'object' && data.data) {
      const d = data.data
      if (typeof d === 'object') {
        // If backend included subtotal/discount, recompute total for consistency
        const subtotal = Number(d.subtotal || 0)
        const couponDiscount = Number(d.couponDiscount || 0)
        const tax = Number(d.tax || 0)
        if (!isNaN(subtotal) || !isNaN(couponDiscount) || !isNaN(tax)) {
          d.total = Math.max(0, subtotal + tax - couponDiscount)
        }
      }
    }
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 502 }
    )
  }
}
