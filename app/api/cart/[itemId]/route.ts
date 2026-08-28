import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"

// PATCH: /api/cart/[itemId] - no-op by design; cart items are always
// quantity 1, so there's nothing to adjust. Just returns the current cart.
export async function PATCH(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const cart = await prisma.cart.findFirst({ where: { userId: user.userId }, include: { items: true } })
  return NextResponse.json({ success: true, data: cart })
}

// DELETE: /api/cart/[itemId] - remove by cart-item id directly
export async function DELETE(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { itemId } = await params
    const cart = await prisma.cart.findFirst({ where: { userId: user.userId } })
    if (!cart) return NextResponse.json({ success: false, error: "ไม่พบตะกร้า" }, { status: 404 })

    const { count } = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } })
    if (count === 0) return NextResponse.json({ success: false, error: "ไม่พบสินค้าในตะกร้า" }, { status: 404 })

    const updatedCart = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } })
    return NextResponse.json({ success: true, data: updatedCart })
  } catch (error) {
    console.error("Remove cart item error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบสินค้า" }, { status: 500 })
  }
}
