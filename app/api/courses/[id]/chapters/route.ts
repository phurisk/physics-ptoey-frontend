import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/courses/[id]/chapters - public chapter+content list for a course
// (the course detail route already returns chapters inline; this exists as a
// standalone fallback for consumers that fetch it separately)
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ success: false, message: "Missing course id", data: [] }, { status: 400 })
  }

  try {
    const chapters = await prisma.chapter.findMany({
      where: { courseId: id },
      include: { contents: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    })
    return NextResponse.json({ success: true, data: chapters })
  } catch (err) {
    console.error("Get public chapters error:", err)
    return NextResponse.json({ success: false, message: "Failed to fetch chapters", data: [] }, { status: 500 })
  }
}
