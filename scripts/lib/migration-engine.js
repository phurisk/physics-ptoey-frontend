// Shared MySQL(legacy) -> Postgres(this repo) migration engine. Used by both
// scripts/migrate-legacy-mysql.js (live connection) and
// scripts/migrate-from-dump.js (offline .sql dump) — the data-source differs,
// but every transform below is identical and shared so both paths are
// exercised against the exact same, once-verified logic.
//
// Pattern adapted from chemistry-ptar-backoffice/scripts/migrate-to-supabase.mjs
// (the sister project's own prior MySQL->Postgres migration): generic
// per-model copy driven by the destination Prisma DMMF, plus a row-count
// check per table. Unlike that script's insert-only `createMany` +
// `skipDuplicates`, this one `upsert`s every row (see upsertAll below) so
// re-running against a refreshed export actually syncs changes to rows that
// already exist, not just adds new ones.

const { PrismaClient, Prisma } = require('@prisma/client')

// Dependency order: parents before children.
const MODEL_ORDER = [
  'User', 'Category', 'PostType', 'EbookCategory', 'ExamCategory', 'VerificationToken', 'Coupon',
  'Account', 'Session', 'Course', 'Post', 'Ebook', 'ExamBank', 'Cart',
  'Chapter', 'Enrollment', 'Exam', 'PostContent', 'Review', 'ExamFile', 'CartItem', 'CouponCategory', 'CouponItem',
  'Content', 'Question', 'Order',
  'QuestionOption', 'Payment', 'Shipping', 'OrderItem', 'CouponUsage', 'EbookDownload', 'ExamAttempt',
  'StudentAnswer',
]

const dmmfModels = Prisma.dmmf.datamodel.models
const modelByName = Object.fromEntries(dmmfModels.map((m) => [m.name, m]))

function prismaClientKey(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Models with no single `id` primary key to upsert on (composite/alternate
// unique key instead).
const UPSERT_KEY = {
  VerificationToken: (row) => ({ token: row.token }),
}

// Re-runnable sync: unlike createMany+skipDuplicates (insert-only, silently
// ignores rows that already exist), this actually updates existing rows too
// — so re-running against a refreshed dump/export picks up real changes,
// not just brand-new rows. Bounded concurrency to avoid exhausting the
// Supabase pooler's connection limit.
async function upsertAll(prisma, clientKey, modelName, rows, concurrency = 20) {
  const keyFn = UPSERT_KEY[modelName] || ((row) => ({ id: row.id }))
  for (const batch of chunk(rows, concurrency)) {
    await Promise.all(
      batch.map((row) => prisma[clientKey].upsert({ where: keyFn(row), update: row, create: row }))
    )
  }
}

// Default: pass columns through as-is, only coercing MySQL's 0/1 tinyint
// into real booleans for fields the destination schema types as Boolean.
function coerceRow(modelDef, row) {
  const out = { ...row }
  for (const field of modelDef.fields) {
    if (!(field.name in out) || out[field.name] === null || out[field.name] === undefined) continue
    if (field.type === 'Boolean') out[field.name] = Boolean(out[field.name])
    // mysqldump exports DATETIME as "YYYY-MM-DD HH:mm:ss.sss" (no 'T', no
    // zone) — not valid per strict ISO-8601, so Prisma's client-side
    // validation rejects the raw string. Convert to a real Date.
    else if (field.type === 'DateTime' && typeof out[field.name] === 'string') {
      out[field.name] = new Date(out[field.name].replace(' ', 'T') + 'Z')
    }
    // node-sql-parser occasionally parses a DECIMAL literal (e.g. "0.2") as
    // a string rather than a number — coerce anything destined for a
    // Float/Int column that isn't already numeric.
    else if ((field.type === 'Float' || field.type === 'Int') && typeof out[field.name] === 'string') {
      out[field.name] = field.type === 'Int' ? parseInt(out[field.name], 10) : parseFloat(out[field.name])
    }
  }
  return out
}

function slugify(input, fallback) {
  const base = String(input || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^฀-๿a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || fallback
}

// ---- Per-model overrides for the handful of models whose shape actually
// changed since this repo forked from the legacy schema.
const OVERRIDES = {
  User: (rows) => rows.map((u) => ({ ...coerceRow(modelByName.User, u), school: null })),

  Course: (rows) => rows.map((c) => ({ ...coerceRow(modelByName.Course, c), gradeLevel: null })),

  EbookCategory: (rows) => {
    const used = new Set()
    return rows.map((c) => {
      let slug = slugify(c.name, c.id)
      let i = 1
      while (used.has(slug)) slug = `${slugify(c.name, c.id)}-${i++}`
      used.add(slug)
      return { ...coerceRow(modelByName.EbookCategory, c), slug }
    })
  },

  Enrollment: (rows) =>
    rows.map((e) => ({ ...coerceRow(modelByName.Enrollment, e), viewedContentIds: [], accessDuration: null, accessHours: null })),

  // Legacy top-level courseId/ebookId/orderType are dropped in this schema
  // (items live exclusively in OrderItem now) — see OrderItem override for
  // the synthesis step that backfills OrderItem rows for pre-OrderItem-era
  // orders before this data would otherwise be lost.
  Order: (rows) =>
    rows.map((o) => {
      const { courseId, ebookId, orderType, ...rest } = o
      return coerceRow(modelByName.Order, rest)
    }),

  OrderItem: (rows, ctx) => {
    const byOrder = new Map()
    for (const oi of rows) {
      if (!byOrder.has(oi.orderId)) byOrder.set(oi.orderId, [])
      byOrder.get(oi.orderId).push(oi)
    }
    const courseTitleById = new Map(ctx.courses.map((c) => [c.id, c.title]))
    const ebookTitleById = new Map(ctx.ebooks.map((e) => [e.id, e.title]))

    const synthesized = []
    for (const o of ctx.orders) {
      if ((byOrder.get(o.id) || []).length > 0) continue
      if (o.courseId) {
        synthesized.push({
          id: `synth-${o.id}-course`,
          orderId: o.id,
          itemType: 'COURSE',
          itemId: o.courseId,
          title: courseTitleById.get(o.courseId) || 'คอร์ส',
          quantity: 1,
          unitPrice: o.subtotal,
          totalPrice: o.subtotal,
          createdAt: o.createdAt,
        })
      } else if (o.ebookId) {
        synthesized.push({
          id: `synth-${o.id}-ebook`,
          orderId: o.id,
          itemType: 'EBOOK',
          itemId: o.ebookId,
          title: ebookTitleById.get(o.ebookId) || 'อีบุ๊ก',
          quantity: 1,
          unitPrice: o.subtotal,
          totalPrice: o.subtotal,
          createdAt: o.createdAt,
        })
      }
    }
    if (synthesized.length > 0) {
      console.log(`  synthesizing ${synthesized.length} OrderItem row(s) for legacy orders with no OrderItem`)
    }
    return [...rows, ...synthesized].map((i) => coerceRow(modelByName.OrderItem, i))
  },

  // Consolidate sender/receiver detail columns into the new single
  // detectedSender/detectedReceiver fields, and fold columns with no
  // destination column at all into `notes` so nothing is silently lost
  // from a financial record.
  Payment: (rows) =>
    rows.map((p) => {
      const sender = [p.senderName, p.senderAccount, p.senderBank].filter(Boolean).join(' / ') || null
      const receiver = [p.receiverName, p.receiverAccount, p.receiverBank].filter(Boolean).join(' / ') || null
      const legacyExtras = []
      if (p.verifiedBy) legacyExtras.push(`verifiedBy: ${p.verifiedBy}`)
      if (p.transactionRef) legacyExtras.push(`transactionRef: ${p.transactionRef}`)
      if (p.validationScore) legacyExtras.push(`validationScore: ${p.validationScore}`)
      if (p.detectedTime) legacyExtras.push(`detectedTime: ${p.detectedTime}`)
      const notes = [p.notes, legacyExtras.length ? `[legacy] ${legacyExtras.join(', ')}` : null].filter(Boolean).join('\n') || null

      let slipAnalysisData = null
      if (p.slipAnalysisData) {
        try {
          slipAnalysisData = typeof p.slipAnalysisData === 'string' ? JSON.parse(p.slipAnalysisData) : p.slipAnalysisData
        } catch {
          slipAnalysisData = { raw: p.slipAnalysisData }
        }
      }

      const {
        senderName, senderAccount, senderBank,
        receiverName, receiverAccount, receiverBank,
        verifiedBy, transactionRef, validationScore, detectedTime,
        ...rest
      } = p

      return {
        ...coerceRow(modelByName.Payment, rest),
        slipAnalysisData,
        detectedSender: sender,
        detectedReceiver: receiver,
        notes,
      }
    }),

  // recipientName/Phone -> name/phone; country, shippingFee (duplicated on
  // Order already), estimatedDelivery, shippedAt, deliveredAt, notes have no
  // destination column in the new schema and are intentionally dropped.
  Shipping: (rows) =>
    rows.map((s) => {
      const { recipientName, recipientPhone, country, shippingFee, estimatedDelivery, shippedAt, deliveredAt, notes, updatedAt, ...rest } = s
      return {
        ...coerceRow(modelByName.Shipping, { ...rest, updatedAt: updatedAt || rest.createdAt }),
        name: recipientName,
        phone: recipientPhone,
      }
    }),

  // Source's unique key includes itemType; destination's doesn't -> dedupe
  // by [couponId, categoryId], keep the first row seen.
  CouponCategory: (rows) => {
    const seen = new Set()
    const deduped = rows.filter((c) => {
      const key = `${c.couponId}:${c.categoryId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return deduped.map((c) => {
      const { itemType, ...rest } = c
      return { ...coerceRow(modelByName.CouponCategory, rest), createdAt: new Date() }
    })
  },

  CouponItem: (rows) => rows.map((c) => ({ ...coerceRow(modelByName.CouponItem, c), createdAt: new Date() })),
}

/**
 * @param {(table: string) => Promise<object[]>} fetchAll
 * @param {{ write?: boolean }} [opts] - write:false runs a dry run (counts only)
 */
async function runMigration(fetchAll, opts = {}) {
  const write = opts.write !== false
  const prisma = new PrismaClient()

  // Cache per-table fetches so Order/Course/Ebook (needed both for their own
  // MODEL_ORDER slot and as OrderItem-synthesis context) are only read once.
  const cache = new Map()
  const getRows = async (table) => {
    if (!cache.has(table)) cache.set(table, await fetchAll(table))
    return cache.get(table)
  }

  const ctx = {
    orders: await getRows('Order'),
    courses: await getRows('Course'),
    ebooks: await getRows('Ebook'),
  }

  let totalMismatch = 0

  for (const modelName of MODEL_ORDER) {
    const modelDef = modelByName[modelName]
    if (!modelDef) throw new Error(`Model ${modelName} not found in generated DMMF`)

    const rawRows = await getRows(modelName)
    const transform = OVERRIDES[modelName] || ((r) => r.map((row) => coerceRow(modelDef, row)))
    const data = transform(rawRows, ctx)

    if (data.length === 0) {
      console.log(`${modelName}: 0 rows (source empty, skipping)`)
      continue
    }

    const clientKey = prismaClientKey(modelName)

    if (write) {
      await upsertAll(prisma, clientKey, modelName, data)
    }

    const pgCount = write ? await prisma[clientKey].count() : null
    const status = !write ? 'DRY-RUN' : pgCount >= data.length ? 'OK' : 'MISMATCH'
    if (status === 'MISMATCH') totalMismatch++
    console.log(`${modelName}: source=${data.length}${write ? ` postgres_total=${pgCount}` : ''} ${status}`)
  }

  await prisma.$disconnect()

  if (totalMismatch > 0) {
    console.error(`\n${totalMismatch} table(s) had row-count mismatches — see above.`)
    process.exitCode = 1
  } else {
    console.log(write ? '\nAll tables copied, row counts look consistent.' : '\nDry run complete — no data written. Re-run with --write to commit.')
  }
}

module.exports = { runMigration, MODEL_ORDER, modelByName }
