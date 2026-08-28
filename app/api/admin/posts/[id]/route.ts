import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/requireAdmin"

// GET: /api/admin/posts/[id] - get a single post
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        postType: { select: { id: true, name: true } },
        postContents: {
          select: { id: true, urlImg: true, name: true, description: true, createdAt: true, author: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!post) return NextResponse.json({ success: false, error: "ไม่พบบทความ" }, { status: 404 })

    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error("Get post error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลบทความ" }, { status: 500 })
  }
}

// PUT: /api/admin/posts/[id] - update a post
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) return NextResponse.json({ success: false, error: "ไม่พบบทความ" }, { status: 404 })

    if (!body.title || !body.postTypeId) {
      return NextResponse.json({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content || null,
        excerpt: body.excerpt || null,
        imageUrl: body.imageUrl || null,
        imageUrlMobileMode: body.imageUrlMobileMode || null,
        slug: body.slug || null,
        isActive: body.isActive ?? true,
        isFeatured: !!body.isFeatured,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        postTypeId: body.postTypeId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        postType: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error: unknown) {
    console.error("Update post error:", error)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "มี slug นี้ถูกใช้งานแล้ว" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการแก้ไขบทความ" }, { status: 400 })
  }
}

// DELETE: /api/admin/posts/[id] - delete a post and its content blocks
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ success: false, error: "ไม่พบบทความ" }, { status: 404 })

    // PostContent has onDelete: Cascade in the schema, so deleting the post
    // is enough — no manual cleanup transaction needed (unlike Course).
    await prisma.post.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "ลบบทความสำเร็จ", data: { id: post.id, title: post.title } })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบบทความ" }, { status: 400 })
  }
}
