import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const origin = `${url.protocol}//${url.host}`
    const code = url.searchParams.get("code") || ""
    const returnUrlParam = url.searchParams.get("returnUrl") || ""
    const stateParam = url.searchParams.get("state") || ""

    // Decide where to send the browser after callback
    let candidate: string | null = null
    if (returnUrlParam) {
      candidate = returnUrlParam
    } else if (stateParam) {
      let s = stateParam
      try { JSON.parse(s) } catch { try { s = decodeURIComponent(s) } catch {} }
      try { JSON.parse(s) } catch { try { s = decodeURIComponent(s) } catch {} }
      try {
        const parsed = JSON.parse(s)
        if (parsed?.returnUrl) candidate = parsed.returnUrl
      } catch {}
    }

    // Default to home
    let redirectTo = `${origin}/`
    if (candidate) {
      try {
        const targetUrl = candidate.startsWith("/") ? new URL(candidate, origin) : new URL(candidate)
        // Only allow same-origin redirects
        if (`${targetUrl.protocol}//${targetUrl.host}` === origin) {
          const finalUrl = new URL(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`, origin)
          if (code) finalUrl.searchParams.set("code", code)
          if (stateParam) finalUrl.searchParams.set("state", stateParam)
          redirectTo = finalUrl.toString()
        }
      } catch {}
    } else {
      // No candidate; attach code/state to home so client can exchange
      const finalUrl = new URL(`/`, origin)
      if (code) finalUrl.searchParams.set("code", code)
      if (stateParam) finalUrl.searchParams.set("state", stateParam)
      redirectTo = finalUrl.toString()
    }

    return NextResponse.redirect(redirectTo)
  } catch {
    return NextResponse.redirect("/")
  }
}
