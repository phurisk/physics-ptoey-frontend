import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/mock-attempts/[attemptId]/pdf - streams the exam's attached PDF
// inline, gated to the student who owns this attempt. The raw Vercel Blob
// URL is never sent to the client, so there's no downloadable link to grab —
// this is the exam paper itself, not something students should be able to
// save and share.
export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { attemptId } = await params
    const attempt = await prisma.mockExamAttempt.findUnique({
      where: { id: attemptId },
      include: { mockExam: { select: { examPdfUrl: true } } },
    })
    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "ไม่พบการทำข้อสอบนี้" }, { status: 404 })
    }
    if (!attempt.mockExam.examPdfUrl) {
      return NextResponse.json({ success: false, error: "ข้อสอบนี้ไม่มีไฟล์ PDF" }, { status: 404 })
    }

    const upstream = await fetch(attempt.mockExam.examPdfUrl, { cache: "no-store" })
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ success: false, error: "โหลดไฟล์ข้อสอบไม่สำเร็จ" }, { status: 502 })
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "inline",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Get mock exam PDF error:", error)
    return NextResponse.json({ success: false, error: "โหลดไฟล์ข้อสอบไม่สำเร็จ" }, { status: 500 })
  }
}
