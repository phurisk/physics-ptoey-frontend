"use client"

import { useAuth } from '@/components/auth-provider'
import { getMyCourses } from '@/lib/api-utils'
import http from '@/lib/http'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function MyCourses() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progressMap, setProgressMap] = useState<Record<string, number>>({}) // <courseId, progress>

  useEffect(() => {
    if (isAuthenticated) {
      loadCourses()
    }
  }, [isAuthenticated])

  const loadCourses = async () => {
    setLoading(true)
    setError('')
    setProgressMap({})

    try {
      const result = await getMyCourses()

      if (result.success) {
        const fetchedCourses = result.courses || []
        setCourses(fetchedCourses)

        // Fetch progress
        const progresses = await Promise.all(
          fetchedCourses.map(async (course: any) => {
            const apiUrl = `/api/progress`
            console.log("Fetching progress for:", `${apiUrl}?userId=${user.id}&courseId=${course.id}`)
            try {
              const res = await http.get(apiUrl, { params: { userId: user.id, courseId: course.id } })
              const json = res.data
              console.log("Response:", json)
              if (json.success) {
                let p = Number(json.data?.percent ?? json.data?.progress ?? 0) || 0
                if (p > 0 && p <= 1) p = p * 100
                const progress = Math.max(0, Math.min(100, Math.round(p)))
                return { courseId: course.id, progress }
              }
            } catch (err) {
              console.error('Error loading progress for course', course.id, err)
            }
            return { courseId: course.id, progress: 0 }
          })
        )
        

        const progressObj: Record<string, number> = {}
        progresses.forEach(p => {
          progressObj[p.courseId] = p.progress
        })

        setProgressMap(progressObj)
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล')
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading && !isAuthenticated) {
    return (
      <div className="text-center p-8 flex items-center justify-center gap-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
        <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูคอร์สของคุณ</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">คอร์สของฉัน</h1>
        <button 
          onClick={loadCourses}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '🔄 กำลังโหลด...' : '🔄 รีเฟรช'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">กำลังโหลดคอร์ส...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => {
            const progress = progressMap[course.id] || 0
            return (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {course.cover && (
                  <img 
                    src={course.cover} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{course.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>ราคา: ฿{course.price?.toLocaleString()}</span>
                    <span>ระดับ: {course.level}</span>
                  </div>

                  {course.instructor && (
                    <p className="text-sm text-gray-600 mb-3">
                      อาจารย์: {course.instructor.name}
                    </p>
                  )}

                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-green-500 h-2"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-500 mb-3">
                    ความคืบหน้า: {progress}%
                  </p>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.status === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.status === 'PUBLISHED' ? 'เปิดแล้ว' : 'กำลังเตรียม'}
                    </span>

                    <button 
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      onClick={() => window.open(`/courses/${course.id}`, '_blank')}
                    >
                      เข้าเรียน
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">ยังไม่มีคอร์ส</h3>
          <p className="text-gray-500 mb-4">คุณยังไม่ได้ซื้อคอร์สเรียนใดๆ</p>
          <button 
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => window.location.href = '/courses'}
          >
            เลือกซื้อคอร์ส
          </button>
        </div>
      )}
    </div>
  )
}
