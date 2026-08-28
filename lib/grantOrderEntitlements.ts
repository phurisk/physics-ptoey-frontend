import { prisma } from "@/lib/prisma"

const DEFAULT_EBOOK_ACCESS_DAYS = 365

/**
 * The single, idempotent place that grants real access after a paid (or
 * free) order — called from both the free-checkout path and the
 * payment-confirmation path. Safe to call repeatedly (checks before
 * creating).
 *
 * Unlike the tawan_dev reference this is ported from, EBOOK purchases DO
 * grant a real entitlement (an EbookDownload row) — the reference left this
 * as a known gap ("no existing consumer reliably uses EbookDownload today"),
 * fixed here so ebook access-gating has something real to check.
 */
export async function grantEntitlementsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) return

  for (const item of order.items) {
    if (item.itemType === "COURSE") {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: order.userId, courseId: item.itemId } },
      })
      if (!existing) {
        await prisma.enrollment.create({ data: { userId: order.userId, courseId: item.itemId, status: "ACTIVE" } })
      }
    } else if (item.itemType === "MOCK_EXAM") {
      const existing = await prisma.mockExamPurchase.findUnique({
        where: { userId_mockExamId: { userId: order.userId, mockExamId: item.itemId } },
      })
      if (!existing) {
        await prisma.mockExamPurchase.create({
          data: { userId: order.userId, mockExamId: item.itemId, orderId: order.id },
        })
      }
    } else if (item.itemType === "EBOOK") {
      const existing = await prisma.ebookDownload.findFirst({
        where: { userId: order.userId, ebookId: item.itemId, orderId: order.id },
      })
      if (!existing) {
        const ebook = await prisma.ebook.findUnique({ where: { id: item.itemId } })
        if (ebook) {
          const accessDays = ebook.accessDuration ?? DEFAULT_EBOOK_ACCESS_DAYS
          const expiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000)
          await prisma.ebookDownload.create({
            data: {
              userId: order.userId,
              ebookId: item.itemId,
              orderId: order.id,
              downloadUrl: ebook.fileUrl || "",
              expiresAt,
            },
          })
        }
      }
    }
  }
}
