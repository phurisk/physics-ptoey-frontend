import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string; examId: string } }
) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const url = new URL(req.url)
    const search = url.search || ""
    const { id: courseId, examId } = params
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""

    const headers: Record<string, string> = { cookie }
    if (authorization) headers["authorization"] = authorization

    const res = await fetch(`${baseUrl}/api/my-courses/course/${encodeURIComponent(courseId)}/exams/${encodeURIComponent(examId)}${search}`, {
      headers,
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch exam detail" },
      { status: 502 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; examId: string } }
) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API_BASE_URL is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { id: courseId, examId } = params
    const cookie = req.headers.get("cookie") ?? ""
    const authorization = req.headers.get("authorization") ?? ""

    const headers: Record<string, string> = {
      cookie,
      "content-type": "application/json",
    }
    if (authorization) headers["authorization"] = authorization

    const res = await fetch(`${baseUrl}/api/my-courses/course/${encodeURIComponent(courseId)}/exams/${encodeURIComponent(examId)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to submit exam" },
      { status: 502 }
    )
  }
}

