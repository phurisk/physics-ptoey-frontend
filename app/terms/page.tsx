"use client"

import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold">ข้อกำหนดการใช้งาน</h1>
      <p className="text-gray-700">
        ขอบคุณที่ใช้บริการของเรา หน้านี้เป็นสรุปข้อกำหนดการใช้งานสำหรับเว็บไซต์และระบบเรียนออนไลน์ของ
        ฟิสิกส์พี่เต้ย โดยการใช้งานเว็บไซต์นี้ แสดงว่าคุณยอมรับข้อกำหนดต่อไปนี้
      </p>
      <div className="space-y-4 text-gray-700">
        <section>
          <h2 className="font-semibold text-gray-900">1) บัญชีผู้ใช้</h2>
          <p>
            คุณตกลงที่จะให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน ดูแลรักษาความปลอดภัยของบัญชี และรับผิดชอบต่อกิจกรรมที่เกิดขึ้นภายใต้บัญชีของคุณ
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900">2) สิทธิ์การเข้าถึงเนื้อหา</h2>
          <p>
            สิทธิ์การเข้าถึงคอร์สหรือสื่อการสอนเป็นสิทธิ์ส่วนบุคคล ห้ามเผยแพร่หรือจำหน่ายซ้ำโดยไม่ได้รับอนุญาต
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900">3) การชำระเงินและการคืนเงิน</h2>
          <p>
            หากมีเงื่อนไขการรับประกัน/คืนเงิน จะระบุไว้ในหน้าคอร์สหรือใบสั่งซื้อเป็นกรณีไป โปรดติดต่อทีมงานหากมีปัญหาในการชำระเงิน
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900">4) ความเป็นส่วนตัว</h2>
          <p>
            เราจะใช้ข้อมูลของคุณตามที่ระบุใน
            <Link href="/privacy" className="text-blue-600 underline ml-1">นโยบายความเป็นส่วนตัว</Link>
          </p>
        </section>
      </div>
      <div>
        <Link href="/" className="inline-block border px-4 py-2 rounded-md">กลับหน้าแรก</Link>
      </div>
    </div>
  )
}

