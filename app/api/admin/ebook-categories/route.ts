import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// Slug is required+unique on EbookCategory but has no UI field of its own —
// derive it from `name` (Thai names keep their characters; only whitespace
// and punctuation collapse to dashes) and disambiguate collisions with a
// numeric suffix.
function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
  return base || `category-${Date.now()}`
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base
  let suffix = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.ebookCategory.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    suffix += 1
    slug = `${base}-${suffix}`
  }
}

// GET: /api/admin/ebook-categories - list all ebook categories
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const categories = await prisma.ebookCategory.findMany({
      include: { _count: { select: { ebooks: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error("Get ebook categories error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงหมวดหมู่อีบุ๊ก" }, { status: 500 })
  }
}

// POST: /api/admin/ebook-categories - create an ebook category
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ success: false, error: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 })

    const slug = await uniqueSlug(slugify(body.name))

    const category = await prisma.ebookCategory.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error("Create ebook category error:", error)
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่อีบุ๊ก" }, { status: 400 })
  }
}
