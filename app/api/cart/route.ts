import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// GET: /api/cart - current user's cart (data can be null if never created)
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const cart = await prisma.cart.findFirst({ where: { userId: user.userId }, include: { items: true } })
    return NextResponse.json({ success: true, data: cart })
  } catch (error) {
    console.error("Get cart error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้า" }, { status: 500 })
  }
}

// POST: /api/cart - add one item (always quantity 1 — no quantity adjustment by design)
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { itemType, itemId, title, quantity = 1, unitPrice } = body

    if (!itemType || !itemId) {
      return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }
    if (quantity !== 1) {
      return NextResponse.json({ success: false, error: "สามารถเพิ่มสินค้าแต่ละชิ้นได้ครั้งละ 1 เท่านั้น" }, { status: 400 })
    }

    let cart = await prisma.cart.findFirst({ where: { userId: user.userId } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.userId } })
    }

    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, itemType, itemId } })
    if (existing) {
      return NextResponse.json({ success: false, error: "มีสินค้านี้ในตะกร้าแล้ว" }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.create({ data: { cartId: cart.id, itemType, itemId, title, quantity: 1, unitPrice } })
    return NextResponse.json({ success: true, data: cartItem })
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" }, { status: 500 })
  }
}

// DELETE: /api/cart - remove by (itemType, itemId)
export async function DELETE(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { itemType, itemId } = body

    const cart = await prisma.cart.findFirst({ where: { userId: user.userId } })
    if (!cart) return NextResponse.json({ success: false, error: "ไม่พบตะกร้า" }, { status: 404 })

    const { count } = await prisma.cartItem.deleteMany({ where: { cartId: cart.id, itemType, itemId } })
    if (count === 0) return NextResponse.json({ success: false, error: "ไม่พบสินค้าในตะกร้า" }, { status: 404 })

    return NextResponse.json({ success: true, deletedCount: count })
  } catch (error) {
    console.error("Remove from cart error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบสินค้า" }, { status: 500 })
  }
}
