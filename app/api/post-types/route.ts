import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: /api/post-types - active post types, public
export async function GET() {
  try {
    const postTypes = await prisma.postType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
    return NextResponse.json({ success: true, data: postTypes })
  } catch (error) {
    console.error("Get post types error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลประเภทบทความ" }, { status: 500 })
  }
}
