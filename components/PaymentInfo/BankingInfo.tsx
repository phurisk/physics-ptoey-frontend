"use client"
import { Button } from "@/components/ui/button"

export default function BankingInfo() {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-700">เลขบัญชี</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wider">091-1-94269-0</span>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText("0911942690")}>คัดลอก</Button>
        </div>
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-700">ชื่อบัญชี</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">บริษัท เดอะนิวตัน เอ็ดดูเคชั่น จำกัด</span>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText("บริษัท เดอะนิวตัน เอ็ดดูเคชั่น จำกัด")}>คัดลอก</Button>
        </div>
      </div>
     
    </div>
  );
}
