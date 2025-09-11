"use client"

// error.tsx เป็น Error Boundary ระดับเส้นทาง (Route) ที่อยู่ใต้ layout
// ต้องไม่ห่อด้วย <html>/<body> เพื่อหลีกเลี่ยงการซ้อนแท็กกับ layout
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <img src="/new-logo.png" alt="logo" className="w-32 h-32 mx-auto" />
        <h1 className="text-2xl font-bold">เกิดข้อผิดพลาดภายในระบบ</h1>
        <p className="text-gray-600 break-all max-w-xl mx-auto">{error?.message || "ไม่ทราบสาเหตุ"}</p>
        <button
          onClick={() => reset()}
          className="inline-block border px-4 py-2 rounded-md"
        >
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  )
}
