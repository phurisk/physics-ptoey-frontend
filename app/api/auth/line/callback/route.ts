import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.redirect("/")
  }

  try {
    const url = new URL(req.url)
    const search = url.search || ""

    const backendUrl = `${baseUrl}/api/auth/line/callback${search}`
    const res = await fetch(backendUrl, {
      redirect: "manual",
      cache: "no-store",
    })

    const setCookie = res.headers.get("set-cookie")
    const redirectTo = "/"
    const response = NextResponse.redirect(redirectTo)
    if (setCookie) response.headers.set("set-cookie", setCookie)
    return response
  } catch (err) {
   
    return NextResponse.redirect("/")
  }
}

