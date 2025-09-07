"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BookOpen, Play, Clock, Users, CheckCircle, Lock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import LoginModal from "@/components/login-modal"
import { useProgress } from "@/lib/progress-utils"

type Content = {
  id: string
  title: string
  contentType: string
  contentUrl: string
  order: number
  chapterId: string
  createdAt: string
}

type Chapter = {
  id: string
  title: string
  order: number
  courseId: string
  createdAt: string
  contents: Content[]
}

type CourseStats = {
  totalChapters: number
  totalContents: number
  totalEnrollments: number
}

type Enrollment = {
  enrollmentId: string
  enrolledAt: string
  progress: number
  status: string
}

type CourseDetail = {
  id: string
  title: string
  description: string
  price: number
  duration: number | null
  isFree: boolean
  status: string
  coverImageUrl: string
  createdAt: string
  updatedAt: string
  instructor: {
    id: string
    name: string
    email: string
    image: string | null
  }
  category: {
    id: string
    name: string
    description: string | null
  }
  chapters: Chapter[]
  stats: CourseStats
  enrollment: Enrollment
}

type CourseResponse = {
  success: boolean
  course: CourseDetail
  message?: string
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [completedContents, setCompletedContents] = useState<string[]>([])

  const courseId = params?.id as string


  const currentProgress = course?.enrollment?.progress || 0
  const enrollmentStatus = course?.enrollment?.status || 'ACTIVE'
  const [progressLoading, setProgressLoading] = useState(false)

  // Calculate progress text and color based on current progress
  const progressText = currentProgress === 0 
    ? 'ยังไม่ได้เริ่มเรียน'
    : currentProgress < 25 
    ? 'เริ่มต้น'
    : currentProgress < 50 
    ? 'กำลังเรียน'
    : currentProgress < 75 
    ? 'เรียนแล้วครึ่งหนึ่ง'
    : currentProgress < 100 
    ? 'เกือบจบแล้ว'
    : 'เรียนจบแล้ว'

  const progressColor = currentProgress === 0 
    ? 'text-gray-500'
    : currentProgress < 50 
    ? 'text-yellow-600'
    : currentProgress < 100 
    ? 'text-blue-600'
    : 'text-green-600'

  useEffect(() => {
    let active = true
    const loadCourse = async () => {
      if (!courseId || !user?.id) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const res = await fetch(`/api/my-courses/course/${courseId}?userId=${encodeURIComponent(user.id)}`, { 
          cache: "no-store" 
        })
        const json: CourseResponse = await res.json().catch(() => ({ success: false, course: null }))
        
        if (!res.ok || json.success === false) {
          throw new Error((json as any)?.error || "โหลดคอร์สไม่สำเร็จ")
        }
        
        if (active) {
          setCourse(json.course)
          // Set first content as default selected
          const firstChapter = json.course.chapters.find(ch => ch.contents.length > 0)
          if (firstChapter && firstChapter.contents.length > 0) {
            setSelectedContent(firstChapter.contents[0])
          }
          
          // Load progress data
          try {
            const progressRes = await fetch(`/api/progress?userId=${encodeURIComponent(user.id)}&courseId=${courseId}`)
            const progressData = await progressRes.json()
            if (progressData.success && progressData.data) {
              setCompletedContents(progressData.data.completedContents || [])
            }
          } catch (progressError) {
            console.warn('Failed to load progress:', progressError)
          }
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? "โหลดคอร์สไม่สำเร็จ")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCourse()
    return () => {
      active = false
    }
  }, [courseId, user?.id])

  // อัพเดทฟังก์ชันเลือกเนื้อหา
  const handleContentSelect = async (content: Content) => {
    // ถ้าเป็นการเลือกเนื้อหาใหม่ (ไม่ใช่การอัพเดท progress)
    if (selectedContent?.id !== content.id) {
      setSelectedContent(content)
      return
    }
    
    // ถ้าเป็นการกดปุ่มอัพเดท progress
    if (user?.id && courseId && !completedContents.includes(content.id)) {
      setProgressLoading(true)
      try {
        const response = await fetch('/api/update-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            courseId,
            contentId: content.id,
          }),
        })

        const result = await response.json()
        if (result.success) {
          // รีโหลดข้อมูลคอร์สเพื่อรับ progress ใหม่
          const courseRes = await fetch(`/api/my-courses/course/${courseId}?userId=${encodeURIComponent(user.id)}`, { 
            cache: "no-store" 
          })
          const courseJson = await courseRes.json()
          if (courseJson.success) {
            setCourse(courseJson.course)
          }
          
          if (result.data?.completedContents) {
            setCompletedContents(result.data.completedContents)
          }
        }
      } catch (error) {
        console.error('Failed to update progress:', error)
      } finally {
        setProgressLoading(false)
      }
    }
  }


  const handleContentClick = (content: Content) => {
    setSelectedContent(content)
  }

  // reset progress
  const handleProgressReset = async () => {
    if (user?.id && courseId) {
      setProgressLoading(true)
      try {
        const response = await fetch(`/api/progress?userId=${user.id}&courseId=${courseId}`, {
          method: 'DELETE',
        })
        
        const result = await response.json()
        if (result.success) {
          // รีโหลดข้อมูลคอร์สเพื่อรับ progress ใหม่
          const courseRes = await fetch(`/api/my-courses/course/${courseId}?userId=${encodeURIComponent(user.id)}`, { 
            cache: "no-store" 
          })
          const courseJson = await courseRes.json()
          if (courseJson.success) {
            setCourse(courseJson.course)
          }
          setCompletedContents([])
        }
      } catch (error) {
        console.error('Failed to reset progress:', error)
      } finally {
        setProgressLoading(false)
      }
    }
  }

  // ฟังก์ชันสำหรับแสดง progress bar
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  )

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-gray-700">กรุณาเข้าสู่ระบบเพื่อดูคอร์สของคุณ</div>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-white" onClick={() => setLoginOpen(true)}>
              เข้าสู่ระบบ
            </Button>
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video player skeleton */}
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          
          {/* Sidebar skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error || "ไม่พบคอร์ส"}</div>
          <Link href="/profile/my-courses">
            <Button variant="outline">กลับไปหน้าคอร์สของฉัน</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile/my-courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          {selectedContent && (
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              {selectedContent.contentType === 'VIDEO' && getYouTubeEmbedUrl(selectedContent.contentUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedContent.contentUrl) || ''}
                  className="w-full aspect-video"
                  allowFullScreen
                  title={selectedContent.title}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-white">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>ไม่สามารถเล่นวิดีโอได้</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Content Info */}
          {selectedContent && (
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{selectedContent.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      วิดีโอ
                    </span>
                    <span>{new Date(selectedContent.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                
                {/* Simple Progress Update Button */}
                <div className="flex items-center gap-2">
                  {completedContents.includes(selectedContent.id) ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">เรียนแล้ว</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleContentSelect(selectedContent)}
                      disabled={progressLoading}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white"
                      size="sm"
                    >
                      {progressLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังอัพเดท...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          ทำเครื่องหมายเรียนแล้ว
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Course Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="aspect-video relative mb-4 rounded overflow-hidden">
                <Image
                  src={course.coverImageUrl || "/placeholder.svg"}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
              
              <h3 className="font-semibold mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">อาจารย์:</span>
                  <span className="font-medium">{course.instructor.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">หมวดหมู่:</span>
                  <Badge variant="secondary">{course.category.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">บทเรียน:</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.stats.totalChapters}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">เนื้อหา:</span>
                  <span className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    {course.stats.totalContents}
                  </span>
                </div>
                
                {/* Progress Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">ความคืบหน้า:</span>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 font-medium ${progressColor}`}>
                        <CheckCircle className="h-4 w-4" />
                        {currentProgress}%
                      </span>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleProgressReset}
                        disabled={progressLoading || currentProgress === 0}
                        className="h-6 w-6 p-0 hover:bg-red-50"
                        title="รีเซ็ตความคืบหน้า"
                      >
                        <RotateCcw className="h-3 w-3 text-red-500" />
                      </Button> */}
                    </div>
                  </div>
                  
                  <ProgressBar progress={currentProgress} />
                  
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className={progressColor}>{progressText}</span>
                    {progressLoading && (
                      <span className="text-gray-500">กำลังอัพเดท...</span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    เรียนแล้ว {completedContents.length} จาก {course.stats.totalContents} เนื้อหา
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">เนื้อหาคอร์ส</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {course.chapters.map((chapter) => (
                  <div key={chapter.id} className="border-b last:border-b-0">
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-medium text-sm">
                        {chapter.order}. {chapter.title}
                      </h4>
                      <div className="text-xs text-gray-600 mt-1">
                        {chapter.contents.length} เนื้อหา
                      </div>
                    </div>
                    
                    {chapter.contents.map((content) => {
                      const isCompleted = completedContents.includes(content.id)
                      const isCurrentContent = selectedContent?.id === content.id
                      
                      return (
                        <button
                          key={content.id}
                          onClick={() => handleContentClick(content)}
                          disabled={progressLoading}
                          className={`w-full p-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between group transition-colors ${
                            isCurrentContent 
                              ? 'bg-yellow-50 border-r-2 border-yellow-400' 
                              : ''
                          } ${progressLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Play className="h-4 w-4 text-gray-400 group-hover:text-yellow-500" />
                            )}
                            <span className={`line-clamp-1 ${isCompleted ? 'text-green-700' : ''}`}>
                              {content.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isCurrentContent && (
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
