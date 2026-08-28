// Spot-check the dump-based migration: pick a few real orders (with
// payment+shipping+items) and a busy user, verify the same data reads back
// correctly on the Postgres side. Adapted from
// chemistry-ptar-backoffice/scripts/verify-migration-spotcheck.mjs for the
// dump-file (not live-connection) migration path.

const { loadDumpTables } = require('./lib/parse-mysql-dump')
const { PrismaClient } = require('@prisma/client')

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/verify-migration-spotcheck.js <path-to-dump.sql>')
  process.exit(1)
}

async function main() {
  const tables = loadDumpTables(filePath)
  const prisma = new PrismaClient()

  const ordersWithPaymentAndShipping = tables.Order.filter(
    (o) => tables.Payment.some((p) => p.orderId === o.id) && tables.Shipping.some((s) => s.orderId === o.id)
  ).slice(0, 3)

  for (const myOrder of ordersWithPaymentAndShipping) {
    const myItems = tables.OrderItem.filter((i) => i.orderId === myOrder.id)
    const myPayment = tables.Payment.find((p) => p.orderId === myOrder.id)
    const myShipping = tables.Shipping.find((s) => s.orderId === myOrder.id)

    const pgOrder = await prisma.order.findUnique({
      where: { id: myOrder.id },
      include: { items: true, payment: true, shipping: true },
    })

    const checks = [
      ['order exists', !!pgOrder],
      ['total matches', pgOrder && Number(pgOrder.total) === Number(myOrder.total)],
      ['userId matches', pgOrder?.userId === myOrder.userId],
      ['item count matches', pgOrder?.items.length === myItems.length],
      ['payment linked', !!pgOrder?.payment && pgOrder.payment.id === myPayment.id],
      ['payment amount matches', pgOrder?.payment && Number(pgOrder.payment.amount) === Number(myPayment.amount)],
      ['shipping linked', !!pgOrder?.shipping && pgOrder.shipping.id === myShipping.id],
      ['shipping name matches (renamed field)', pgOrder?.shipping?.name === myShipping.recipientName],
    ]
    const allPass = checks.every(([, ok]) => ok)
    console.log(`Order ${myOrder.id}: ${allPass ? 'OK' : 'FAIL'}`)
    if (!allPass) for (const [label, ok] of checks) if (!ok) console.log(`  FAILED: ${label}`)
  }

  // A user with multiple enrollments
  const enrollmentCounts = new Map()
  for (const e of tables.Enrollment) enrollmentCounts.set(e.userId, (enrollmentCounts.get(e.userId) || 0) + 1)
  const [busyUserId] = [...enrollmentCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  const myEnrollments = tables.Enrollment.filter((e) => e.userId === busyUserId)

  const pgUser = await prisma.user.findUnique({
    where: { id: busyUserId },
    include: { enrollments: { include: { course: true } } },
  })
  const enrollOk =
    pgUser && pgUser.enrollments.length === myEnrollments.length && pgUser.enrollments.every((e) => e.course && typeof e.course.title === 'string')
  console.log(`User ${busyUserId} (${myEnrollments.length} enrollments): ${enrollOk ? 'OK' : 'FAIL'}`)

  // Synthesized OrderItem check: orders that had no OrderItem in the dump
  // should now have exactly one, with the right itemType/itemId.
  const legacyOrdersNoItem = tables.Order.filter((o) => (o.courseId || o.ebookId) && !tables.OrderItem.some((i) => i.orderId === o.id))
  let synthOk = true
  for (const o of legacyOrdersNoItem.slice(0, 5)) {
    const pgItems = await prisma.orderItem.findMany({ where: { orderId: o.id } })
    const expectedItemId = o.courseId || o.ebookId
    const ok = pgItems.length === 1 && pgItems[0].itemId === expectedItemId
    if (!ok) synthOk = false
    console.log(`Synthesized OrderItem for order ${o.id}: ${ok ? 'OK' : 'FAIL'}`)
  }
  console.log(`Synthesized OrderItem checks (${legacyOrdersNoItem.length} total, checked ${Math.min(5, legacyOrdersNoItem.length)}): ${synthOk ? 'OK' : 'FAIL'}`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
