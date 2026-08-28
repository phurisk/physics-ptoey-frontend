import nodemailer from "nodemailer"

// Best-effort payment notifications, sent to the customer. Callers already
// treat failures as non-fatal (payment/order state doesn't depend on email
// delivery succeeding).

function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Gmail App Password
      },
    })
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return null
}

function isConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) || !!process.env.SMTP_HOST
}

function fromAddress() {
  const address = process.env.EMAIL_USER || process.env.SMTP_USER
  return `"Physics Ptoey" <${address}>`
}

async function send(to: string, subject: string, html: string) {
  if (!isConfigured()) {
    console.log(`[email] not configured, skipping: "${subject}" -> ${to}`)
    return
  }
  const transporter = createTransporter()
  if (!transporter) return
  try {
    await transporter.sendMail({ from: fromAddress(), to, subject, html })
  } catch (error) {
    console.error("[email] send failed:", error)
  }
}

function wrapTemplate(title: string, color: string, bodyHtml: string) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${color}; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">${title}</h2>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #e5e7eb;">
            ${bodyHtml}
          </div>
          <div style="background-color: #6b7280; color: #fff; padding: 12px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
            Physics Ptoey E-Learning
          </div>
        </div>
      </body>
    </html>
  `
}

export async function sendPaymentApprovedEmail(to: string | null | undefined, orderId: string) {
  if (!to) return
  const html = wrapTemplate(
    "🎉 การชำระเงินสำเร็จ",
    "#16a34a",
    `<p>คำสั่งซื้อของคุณได้รับการยืนยันแล้ว</p>
     <p><strong>หมายเลขคำสั่งซื้อ:</strong> ${orderId}</p>
     <p>ขอบคุณที่ใช้บริการครับ</p>`
  )
  await send(to, `การชำระเงินสำเร็จ - คำสั่งซื้อ ${orderId}`, html)
}

export async function sendPaymentPendingEmail(to: string | null | undefined, orderId: string) {
  if (!to) return
  const html = wrapTemplate(
    "📋 ได้รับสลิปแล้ว รอตรวจสอบ",
    "#d97706",
    `<p>เราได้รับสลิปการโอนเงินของคุณแล้ว และกำลังอยู่ระหว่างการตรวจสอบ</p>
     <p><strong>หมายเลขคำสั่งซื้อ:</strong> ${orderId}</p>
     <p>เราจะแจ้งผลให้ทราบทางอีเมลนี้อีกครั้งเมื่อตรวจสอบเสร็จสิ้น</p>`
  )
  await send(to, `รอตรวจสอบการชำระเงิน - คำสั่งซื้อ ${orderId}`, html)

  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL
  if (adminTo) {
    const adminHtml = wrapTemplate(
      "📋 มีสลิปใหม่รอตรวจสอบ",
      "#d97706",
      `<p><strong>หมายเลขคำสั่งซื้อ:</strong> ${orderId}</p>
       <p><strong>ลูกค้า:</strong> ${to}</p>
       <p>กรุณาตรวจสอบใน Admin Panel</p>`
    )
    await send(adminTo, `[Admin] รอตรวจสอบสลิป - คำสั่งซื้อ ${orderId}`, adminHtml)
  }
}
