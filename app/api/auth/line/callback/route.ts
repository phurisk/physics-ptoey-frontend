import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.redirect("/")
  }

  try {
    const url = new URL(req.url)
    const search = url.search || ""
    const returnUrlParam = url.searchParams.get("returnUrl") || ""

    const backendUrl = `${baseUrl}/api/auth/callback/line${search}`
    const res = await fetch(backendUrl, {
      redirect: "manual",
      cache: "no-store",
    })

    const setCookie = res.headers.get("set-cookie")
    // Determine safe redirect target
    let redirectTo = "/"
    try {
      if (returnUrlParam) {
        if (returnUrlParam.startsWith("/")) {
          redirectTo = returnUrlParam
        } else {
          const target = new URL(returnUrlParam)
          const origin = `${url.protocol}//${url.host}`
          if (`${target.protocol}//${target.host}` === origin) {
            redirectTo = `${target.pathname}${target.search}${target.hash}` || "/"
          }
        }
      }
    } catch {}
    const response = NextResponse.redirect(redirectTo)
    if (setCookie) response.headers.set("set-cookie", setCookie)
    return response
  } catch (err) {
   
    return NextResponse.redirect("/")
  }
}
