import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/users/[id]/practice-tokens - view a user's practice wallet
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: userId } = await params
    const wallet = await prisma.mockPracticeWallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
    return NextResponse.json({ success: true, data: wallet })
  } catch (error) {
    console.error("Get practice tokens error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลโทเคน" }, { status: 500 })
  }
}

// PUT: /api/admin/users/[id]/practice-tokens - set a user's practice token balance
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id: userId } = await params
    const body = await req.json()
    const tokens = Number(body?.tokens)
    if (!Number.isInteger(tokens) || tokens < 0) {
      return NextResponse.json({ success: false, error: "tokens ต้องเป็นจำนวนเต็มไม่ติดลบ" }, { status: 400 })
    }

    const wallet = await prisma.mockPracticeWallet.upsert({
      where: { userId },
      update: { tokens },
      create: { userId, tokens },
    })
    return NextResponse.json({ success: true, data: wallet })
  } catch (error) {
    console.error("Update practice tokens error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขโทเคน" }, { status: 400 })
  }
}
