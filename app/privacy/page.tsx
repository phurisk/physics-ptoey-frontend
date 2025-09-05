"use client"

import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold">นโยบายความเป็นส่วนตัว</h1>
      <p className="text-gray-700">
        เราให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้ หน้านี้อธิบายวิธีการเก็บ ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
        เมื่อใช้งานเว็บไซต์และระบบเรียนออนไลน์ของเรา
      </p>
      <div className="space-y-4 text-gray-700">
        <section>
          <h2 className="font-semibold text-gray-900">ข้อมูลที่เก็บรวบรวม</h2>
          <p>
            อีเมล ชื่อ และข้อมูลที่จำเป็นต่อการให้บริการ รวมถึงประวัติการสั่งซื้อและการเข้าเรียน
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900">วัตถุประสงค์การใช้งานข้อมูล</h2>
          <p>
            เพื่อยืนยันตัวตน จัดการคำสั่งซื้อ ให้บริการเรียนออนไลน์ และปรับปรุงประสบการณ์ใช้งาน
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900">การเปิดเผยข้อมูล</h2>
          <p>
            เราจะไม่ขายหรือเปิดเผยข้อมูลของคุณต่อบุคคลที่สาม ยกเว้นตามกฎหมายหรือเพื่อให้บริการที่จำเป็น
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-900">สิทธิ์ของผู้ใช้</h2>
          <p>
            คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้ โดยติดต่อทีมงานของเรา
          </p>
        </section>
      </div>
      <div>
        <Link href="/" className="inline-block border px-4 py-2 rounded-md">กลับหน้าแรก</Link>
      </div>
    </div>
  )
}

