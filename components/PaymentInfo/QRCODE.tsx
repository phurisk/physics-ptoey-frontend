"use client"
import Image from "next/image"

export default function QRCODE() {
  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <div className="flex w-65 flex-col overflow-hidden rounded-md border bg-white">
        <div className="bg-white p-2">
          <Image
            src="/slip_qr/promptpay.png"
            alt="PromptPay"
            width={192}
            height={64}
            className="h-auto w-full object-contain"
          />
        </div>
        <div className="bg-white px-2 pb-2">
          <Image
            src="/slip_qr/QR_Pic.png"
            alt="QR Code สำหรับการโอนเงิน"
            width={192}
            height={192}
            className="h-auto w-full object-contain"
          />
        </div>
        <div className="space-y-1 bg-white px-2 pb-3 text-center text-xs text-gray-600">
          <div>กวดวิชาภาษาฟิสิกส์อาจารย์เต้ย</div>
          <div>บัญชี บจก. เดอะนิวตัน เอ็ดดูเคชั่น</div>
          <div>เลขอ้างอิง: KPS004KB000002221165</div>
        </div>
      </div>
      <span className="text-xs text-gray-600 text-center">
        สแกน QR เพื่อโอนเงิน
      </span>
    </div>
  );
}
