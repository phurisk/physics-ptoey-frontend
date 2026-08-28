import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/requireUser"
import { validateFile, generateUniqueFilename, uploadToVercelBlob } from "@/lib/vercel-blob"
import { verifySlipWithEasySlip, calculateSlipConfidence } from "@/lib/easyslip"
import { grantEntitlementsForOrder } from "@/lib/grantOrderEntitlements"
import { sendPaymentApprovedEmail, sendPaymentPendingEmail } from "@/lib/email"

// POST: /api/payments/upload-slip - upload a payment slip + attempt auto-verification
export async function POST(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const orderId = formData.get("orderId") as string | null
    const school = formData.get("school") as string | null
    const shippingName = formData.get("shippingName") as string | null
    const shippingPhone = formData.get("shippingPhone") as string | null
    const shippingAddress = formData.get("shippingAddress") as string | null
    const shippingDistrict = formData.get("shippingDistrict") as string | null
    const shippingProvince = formData.get("shippingProvince") as string | null
    const shippingPostalCode = formData.get("shippingPostalCode") as string | null

    if (!file || !orderId) {
      return NextResponse.json({ success: false, error: "กรุณาอัปโหลดไฟล์และระบุคำสั่งซื้อ" }, { status: 400 })
    }

    const validation = validateFile(file, ["image/jpeg", "image/jpg", "image/png", "image/webp"])
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.errors.join(", ") }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, coupon: true, payment: true, shipping: true } })
    if (!order) return NextResponse.json({ success: false, error: "ไม่พบคำสั่งซื้อ" }, { status: 404 })
    if (order.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้" }, { status: 403 })
    }

    if (!order.user.school) {
      if (!school?.trim()) return NextResponse.json({ success: false, error: "กรุณากรอกชื่อโรงเรียน" }, { status: 400 })
      await prisma.user.update({ where: { id: order.userId }, data: { school: school.trim() } })
    }

    if (!order.shipping) {
      const missing: string[] = []
      if (!shippingName) missing.push("ชื่อผู้รับ")
      if (!shippingPhone) missing.push("เบอร์โทร")
      if (!shippingAddress) missing.push("ที่อยู่")
      if (!shippingDistrict) missing.push("อำเภอ/เขต")
      if (!shippingProvince) missing.push("จังหวัด")
      if (!shippingPostalCode) missing.push("รหัสไปรษณีย์")
      if (missing.length > 0) {
        return NextResponse.json({ success: false, error: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missing.join(", ")}` }, { status: 400 })
      }
      const phoneDigits = (shippingPhone || "").replace(/\D/g, "")
      if (phoneDigits.length !== 10) return NextResponse.json({ success: false, error: "กรุณากรอกเบอร์โทรให้เป็นตัวเลข 10 หลัก" }, { status: 400 })
      const postalDigits = (shippingPostalCode || "").replace(/\D/g, "")
      if (postalDigits.length !== 5) return NextResponse.json({ success: false, error: "กรุณากรอกรหัสไปรษณีย์เป็นตัวเลข 5 หลัก" }, { status: 400 })

      await prisma.shipping.create({
        data: {
          orderId: order.id,
          name: shippingName!,
          phone: shippingPhone!,
          address: shippingAddress!,
          district: shippingDistrict!,
          province: shippingProvince!,
          postalCode: shippingPostalCode!,
        },
      })
    }

    const filename = generateUniqueFilename(`slip_${orderId}_${file.name}`)
    const upload = await uploadToVercelBlob(file, `payment-slips/${filename}`)

    const verification = await verifySlipWithEasySlip(file)
    const { totalScore, details, shouldAutoApprove } = calculateSlipConfidence(verification, order)

    const notes = verification.success
      ? `ตรวจสอบอัตโนมัติ - Confidence: ${totalScore}%`
      : `ตรวจสอบด้วยตนเอง - Confidence: 0% (${verification.error || "verification unavailable"})`

    const paymentData = {
      status: (shouldAutoApprove ? "COMPLETED" : "PENDING_VERIFICATION") as "COMPLETED" | "PENDING_VERIFICATION",
      amount: order.total,
      slipUrl: upload.url,
      uploadedAt: new Date(),
      verifiedAt: shouldAutoApprove ? new Date() : null,
      slipAnalysisData: verification as object,
      confidenceScore: totalScore,
      validationPassed: shouldAutoApprove,
      lastAnalyzedAt: new Date(),
      notes,
      analysisError: verification.success ? null : verification.error,
      detectedAmount: verification.amount ?? null,
      detectedDate: verification.transDate ? new Date(verification.transDate) : null,
      detectedSender: verification.sender?.name ?? null,
      detectedReceiver: verification.receiver?.name ?? null,
    }

    const payment =
      order.payment && order.payment.status !== "REJECTED" && order.payment.status !== "FAILED"
        ? await prisma.payment.update({ where: { id: order.payment.id }, data: paymentData })
        : await prisma.payment.create({ data: { orderId: order.id, ref: `SLIP${Date.now()}`, ...paymentData } })

    if (shouldAutoApprove) {
      try {
        await grantEntitlementsForOrder(order.id)
        await prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } })
        await sendPaymentApprovedEmail(order.user.email, order.id)
      } catch (approveError) {
        console.error("Auto-approve error:", approveError)
      }
    } else {
      await sendPaymentPendingEmail(order.user.email, order.id).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      data: {
        payment,
        verification,
        confidence: totalScore,
        confidenceDetails: details,
        autoApproved: shouldAutoApprove,
        upload,
        message: shouldAutoApprove ? "ตรวจสอบสลิปสำเร็จ ระบบอนุมัติอัตโนมัติ" : "อัปโหลดสลิปสำเร็จ รอการตรวจสอบ",
      },
    })
  } catch (error) {
    console.error("Upload slip error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปโหลดสลิป" }, { status: 500 })
  }
}

// GET: /api/payments/upload-slip?orderId=|paymentId= - fetch a payment record
export async function GET(req: Request) {
  const user = requireUser(req)
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get("paymentId")
    const orderId = searchParams.get("orderId")

    const payment = paymentId
      ? await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: { include: { user: true } } } })
      : await prisma.payment.findFirst({ where: { orderId: orderId ?? undefined }, orderBy: { createdAt: "desc" }, include: { order: { include: { user: true } } } })

    if (!payment) return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 })
    if (payment.order.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: { payment, order: payment.order } })
  } catch (error) {
    console.error("Get payment error:", error)
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน" }, { status: 500 })
  }
}
