"use client"

import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <Image
          src="/new-logo.png"
          alt="logo"
          width={128}
          height={128}
          className="w-32 h-32 mx-auto"
          sizes="128px"
        />
        <h1 className="text-3xl font-bold">ไม่พบหน้าที่ต้องการ</h1>
        <p className="text-gray-600">ลิงก์อาจถูกย้ายหรือลบออกแล้ว</p>
        <Link href="/" className="inline-block border px-4 py-2 rounded-md">กลับหน้าแรก</Link>
      </div>
    </div>
  )
}
