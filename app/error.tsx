"use client"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center space-y-4">
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
      </body>
    </html>
  )
}

