// EasySlip payment-slip verification. Degrades gracefully (returns a
// success:false result, never throws) when EASYSLIP_API_KEY isn't
// configured, so slip upload still works — just without auto-approval.

type SlipParty = { account?: string; name?: string; bank?: string }

export type SlipVerificationResult = {
  success: boolean
  error?: string
  amount?: number
  transDate?: string
  transTime?: string
  sender?: SlipParty
  receiver?: SlipParty
  ref?: string
  confidence?: number
  raw?: unknown
}

export async function verifySlipWithEasySlip(file: File): Promise<SlipVerificationResult> {
  const apiKey = process.env.EASYSLIP_API_KEY
  if (!apiKey) {
    return { success: false, error: "EasySlip API key not configured" }
  }

  try {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("https://developer.easyslip.com/api/v1/verify", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })
    const result = await res.json()

    if (result.status === 200 && result.data) {
      const d = result.data
      return {
        success: true,
        amount: d.amount?.amount ?? d.amount,
        transDate: d.date,
        transTime: d.time,
        sender: { account: d.sender?.account?.value, name: d.sender?.name, bank: d.sender?.bank?.name },
        receiver: { account: d.receiver?.account?.value, name: d.receiver?.name, bank: d.receiver?.bank?.name },
        ref: d.ref,
        confidence: 1.0,
        raw: result,
      }
    }
    return { success: false, error: result.message || "Verification failed", raw: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "EasySlip request failed" }
  }
}

function verifyReceiverAccount(receiver: SlipParty | undefined) {
  const expected = {
    number: process.env.PAYMENT_ACCOUNT_NUMBER || "",
    name: process.env.PAYMENT_ACCOUNT_NAME || "",
    bankCode: process.env.PAYMENT_BANK_CODE || "",
  }

  let score = 0
  const receivedAccount = (receiver?.account || "").replace(/[-\s]/g, "")
  const expectedAccount = expected.number.replace(/[-\s]/g, "")
  if (expectedAccount && receivedAccount === expectedAccount) score += 20

  const receivedName = (receiver?.name || "").toLowerCase().trim()
  const expectedName = expected.name.toLowerCase().trim()
  if (expectedName && receivedName && (receivedName.includes(expectedName) || expectedName.includes(receivedName))) score += 10

  const receivedBank = (receiver?.bank || "").toLowerCase()
  if (expected.bankCode && receivedBank.includes(expected.bankCode.toLowerCase())) score += 5

  return { score, match: score >= 30 }
}

export function calculateSlipConfidence(verification: SlipVerificationResult, order: { total: number; createdAt: Date }) {
  const details = {
    amount: { score: 0, match: false },
    date: { score: 0, match: false },
    account: { score: 0, match: false },
    bankPresence: { score: 0 },
  }

  if (verification.amount != null) {
    const tolerance = Math.max(1, order.total * 0.01)
    const match = Math.abs(verification.amount - order.total) <= tolerance
    details.amount = { score: match ? 30 : 0, match }
  }

  if (verification.transDate) {
    const slipDate = new Date(verification.transDate)
    const daysDiff = Math.abs((slipDate.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const match = daysDiff <= 7
    details.date = { score: match ? Math.max(10, 25 - daysDiff * 2) : 0, match }
  }

  const accountCheck = verifyReceiverAccount(verification.receiver)
  details.account = { score: accountCheck.score, match: accountCheck.match }

  if (verification.sender?.bank || verification.receiver?.bank) {
    details.bankPresence = { score: 10 }
  }

  const totalScore = details.amount.score + details.date.score + details.account.score + details.bankPresence.score
  const shouldAutoApprove = totalScore >= 80 && details.account.match

  return { totalScore, details, shouldAutoApprove }
}
