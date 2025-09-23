'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Play,
  CheckCircle,
  X,
  Menu,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import LoginModal from '@/components/login-modal'
import { useAuth } from '@/components/auth-provider'
import Player from '@vimeo/player'

// ===== Types =====

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


function getYouTubeEmbedUrl(url: string) {
  const idMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/
  )?.[1]
  return idMatch ? `https://www.youtube-nocookie.com/embed/${idMatch}?rel=0&modestbranding=1` : null
}

function getVimeoEmbedUrl(url: string) {
  const idMatch = url.match(/(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(\d+)/)?.[1]
  return idMatch ? `https://player.vimeo.com/video/${idMatch}?dnt=1&title=0&byline=0&portrait=0` : null
}

function getEmbedSrc(url: string) {
  return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url) || null
}

function getVideoThumbnailUrl(url: string) {
  const ytId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1]
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
  const vmId = url.match(/(?:vimeo\.com|player\.vimeo\.com)\/(?:video\/)?(\d+)/)?.[1]
  if (vmId) return `https://vumbnail.com/${vmId}.jpg`
  return null
}


function indexToProgress(index: number, total: number) {
  if (total <= 0) return 0
  return Math.round(((index + 1) / total) * 100)
}

function progressToIndex(progress: number, total: number) {
  if (total <= 0) return -1
  let best = -1
  for (let i = 0; i < total; i++) {
    const p = indexToProgress(i, total)
    if (p <= progress) best = i
    else break
  }
  return best
}

type FlatItem = { index: number; content: Content; chapter: Chapter }

// ===== Component =====

export default function CourseDetailPage() {
  const params = useParams()
  const { isAuthenticated, user, loading: authLoading } = useAuth()

  const [courseLoading, setCourseLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)

  const [highestCompletedIndex, setHighestCompletedIndex] = useState<number>(-1)
  const [progressLoading, setProgressLoading] = useState(false)


  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [videoReplayVisible, setVideoReplayVisible] = useState(false)
  const [videoEmbedKey, setVideoEmbedKey] = useState(0)
  const videoFrameRef = useRef<HTMLIFrameElement | null>(null)
  const videoPlayerRef = useRef<Player | null>(null)

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const courseId = params?.id as string

 


  const flat: FlatItem[] = useMemo(() => {
    if (!course) return []
    const chaptersSorted = [...course.chapters].sort((a, b) => a.order - b.order)
    let idx = 0
    const items: FlatItem[] = []
    for (const ch of chaptersSorted) {
      const contentsSorted = [...ch.contents].sort((a, b) => a.order - b.order)
      for (const c of contentsSorted) {
        items.push({ index: idx++, content: c, chapter: ch })
      }
    }
    return items
  }, [course])

  const totalContents = flat.length

  const contentIndexMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const item of flat) m.set(item.content.id, item.index)
    return m
  }, [flat])


  const selectedItem = useMemo(
    () => flat.find((f) => f.content.id === selectedContent?.id),
    [flat, selectedContent?.id]
  )
  const currentChapter = selectedItem?.chapter
  const selectedEmbedSrc = useMemo(() => {
    if (!selectedContent || selectedContent.contentType !== 'VIDEO') return null
    return getEmbedSrc(selectedContent.contentUrl)
  }, [selectedContent])
  const isSelectedVimeo = useMemo(
    () => selectedEmbedSrc?.includes('player.vimeo.com') ?? false,
    [selectedEmbedSrc]
  )
  const selectedContentIndex = selectedItem?.index ?? -1
  const nextPlayableContent = useMemo(() => {
    if (selectedContentIndex === -1) return null
    for (let i = selectedContentIndex + 1; i < flat.length; i++) {
      const item = flat[i]
      if (item.content.contentType !== 'VIDEO') continue
      if (!getEmbedSrc(item.content.contentUrl)) continue
      return item.content
    }
    return null
  }, [flat, selectedContentIndex])
  const isCurrentCompleted = selectedContentIndex !== -1 && selectedContentIndex <= highestCompletedIndex
  const hasOverlay = videoReplayVisible && isSelectedVimeo
  const completedCount = Math.max(0, highestCompletedIndex + 1)


  const currentProgress = course?.enrollment?.progress || 0
  const progressText =
    currentProgress === 0
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

  const progressColor =
    currentProgress === 0
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
        if (!authLoading) setCourseLoading(false)
        return
      }

      try {
        setCourseLoading(true)
        const res = await fetch(
          `/api/my-courses/course/${courseId}?userId=${encodeURIComponent(user.id)}`,
          { cache: 'no-store' }
        )
        const json: CourseResponse = await res
          .json()
          .catch(() => ({ success: false, course: null } as unknown as CourseResponse))

        if (!res.ok || json.success === false) {
          throw new Error((json as any)?.error || 'โหลดคอร์สไม่สำเร็จ')
        }

        if (active) {
          setCourse(json.course)

          const firstChapter = [...json.course.chapters]
            .sort((a, b) => a.order - b.order)
            .find((ch) => ch.contents.length > 0)
          if (firstChapter) {
            const firstContent = [...firstChapter.contents].sort((a, b) => a.order - b.order)[0]
            setSelectedContent(firstContent)
          }

         
          const total = json.course.stats?.totalContents ?? 0
          const hi = progressToIndex(json.course.enrollment?.progress ?? 0, total)
          setHighestCompletedIndex(hi)
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? 'โหลดคอร์สไม่สำเร็จ')
      } finally {
        if (active) setCourseLoading(false)
      }
    }

    loadCourse()
    return () => {
      active = false
    }
  }, [courseId, user?.id, authLoading])

  useEffect(() => {
    setVideoReplayVisible(false)
    setVideoEmbedKey((key) => key + 1)
  }, [selectedEmbedSrc])

  useEffect(() => {
    if (!isSelectedVimeo || !selectedEmbedSrc) {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.unload().catch(() => { })
        videoPlayerRef.current = null
      }
      return
    }

    if (!videoFrameRef.current) return

    const player = new Player(videoFrameRef.current, { dnt: true })
    videoPlayerRef.current = player

    const handleEnded = async () => {
      setVideoReplayVisible(true)
      try {
        await player.unload()
      } catch { }
    }

    player.on('ended', handleEnded)

    return () => {
      player.off('ended', handleEnded)
      player.unload().catch(() => { })
      if (videoPlayerRef.current === player) videoPlayerRef.current = null
    }
  }, [isSelectedVimeo, selectedEmbedSrc, videoEmbedKey])

  const handleMarkCompleted = async (content: Content) => {
    if (!user?.id || !courseId) return
    if (!course) return

    const idx = contentIndexMap.get(content.id)
    if (idx === undefined) return
    if (idx <= highestCompletedIndex) return

    const prevIndex = highestCompletedIndex
    const total = totalContents

    const optimisticIndex = Math.max(prevIndex, idx)
    setHighestCompletedIndex(optimisticIndex)
    setCourse((prev) => {
      if (!prev) return prev
      const newProgress = indexToProgress(optimisticIndex, total)
      return {
        ...prev,
        enrollment: {
          ...prev.enrollment,
          progress: newProgress,
          status: newProgress >= 100 ? 'COMPLETED' : prev.enrollment.status,
        },
      }
    })

    setProgressLoading(true)
    try {
      const response = await fetch('/api/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId, contentId: content.id }),
      })
      const result = await response.json()

      if (!response.ok || !result?.success) {
        // rollback
        setHighestCompletedIndex(prevIndex)
        setCourse((prev) => {
          if (!prev) return prev
          const rollbackProgress = indexToProgress(prevIndex, total)
          return {
            ...prev,
            enrollment: {
              ...prev.enrollment,
              progress: rollbackProgress,
              status: rollbackProgress >= 100 ? 'COMPLETED' : prev.enrollment.status,
            },
          }
        })
        return
      }

      // sync จาก API
      setCourse((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          enrollment: {
            ...prev.enrollment,
            progress: result.progress ?? prev.enrollment.progress,
            status: result.status ?? prev.enrollment.status,
          },
        }
      })

      const apiIndex = progressToIndex(result.progress ?? 0, total)
      setHighestCompletedIndex((cur) => Math.max(cur, apiIndex))
    } catch {
      // rollback
      setHighestCompletedIndex(prevIndex)
      setCourse((prev) => {
        if (!prev) return prev
        const rollbackProgress = indexToProgress(prevIndex, total)
        return {
          ...prev,
          enrollment: {
            ...prev.enrollment,
            progress: rollbackProgress,
            status: rollbackProgress >= 100 ? 'COMPLETED' : prev.enrollment.status,
          },
        }
      })
    } finally {
      setProgressLoading(false)
    }
  }

  const handleSelectContent = (content: Content) => {
    setSelectedContent(content)
    setVideoReplayVisible(false)
    setIsSidebarOpen(false)
  }

  const handleReplayVideo = () => {
    setVideoReplayVisible(false)
    setVideoEmbedKey((key) => key + 1)
  }

  const handlePlayNextAvailable = () => {
    if (!nextPlayableContent) return
    handleSelectContent(nextPlayableContent)
  }

  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  )

  if (authLoading && !isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white border rounded-lg p-6 flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
          <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-gray-700">กรุณาเข้าสู่ระบบเพื่อดูคอร์สของคุณ</div>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-white"
              onClick={() => setLoginOpen(true)}
            >
              เข้าสู่ระบบ
            </Button>
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
      </div>
    )
  }

  if (courseLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="hidden lg:block"><Skeleton className="h-[60vh] w-full rounded" /></div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="aspect-video w-full rounded" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error || 'ไม่พบคอร์ส'}</div>
        <Link href="/profile/my-courses">
          <Button variant="outline">กลับไปหน้าคอร์สของฉัน</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-4 sticky top-0 z-30 ">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/profile/my-courses">
              <Button variant="ghost" size="sm" className="shrink-0">
                <ArrowLeft className="h-4 w-4 mr-2" /> กลับ
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 line-clamp-1">
              {course.title}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-4 w-4 mr-2" /> สารบัญคอร์ส
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className={`${isSidebarOpen ? 'fixed inset-0 z-40 lg:static lg:z-auto' : 'hidden lg:block'}`}>
            {isSidebarOpen && (
              <div
                className="absolute inset-0 bg-black/40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <div className="absolute lg:static inset-y-0 left-0 w-11/12 sm:w-2/3 max-w-[380px] lg:w-auto bg-white border border-gray-200 rounded-none lg:rounded-md shadow-lg lg:shadow-none lg:sticky lg:top-24 h-full lg:h-[calc(100vh-8rem)] overflow-hidden">
              <Card className="h-full border-0">
                <CardContent className="p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" /> เนื้อหาคอร์ส
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {course.chapters
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((chapter) => {
                        const isOpen = currentChapter?.id === chapter.id
                        const contentsSorted = [...chapter.contents].sort((a, b) => a.order - b.order)
                        return (
                          <div key={chapter.id} className="space-y-2">
                            <Button
                              variant={isOpen ? 'default' : 'ghost'}
                              className={`w-full justify-start text-left h-auto p-3 ${isOpen ? 'text-white bg-yellow-500 hover:opacity-90' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              onClick={() => {
                                const first = contentsSorted[0]
                                if (first) setSelectedContent(first)
                              }}
                            >
                              <div>
                                <div className="font-medium text-balance">
                                  Chapter {chapter.order}: {chapter.title}
                                </div>
                                <div className="text-xs opacity-80 text-pretty">
                                  {chapter.contents.length} เนื้อหา
                                </div>
                              </div>
                            </Button>

                            {isOpen && (
                              <div className="ml-4 space-y-1">
                                {contentsSorted.map((c) => {
                                  const isCurrent = selectedContent?.id === c.id
                                  const idx = contentIndexMap.get(c.id) ?? -1
                                  const isCompleted = idx <= highestCompletedIndex && idx !== -1
                                  return (
                                    <Button
                                      key={c.id}
                                      variant="ghost"
                                      size="sm"
                                      className={`w-full justify-start text-left h-auto p-2 ${isCurrent
                                          ? ' text-gray-800 border-l-2 border-l-yellow-300'
                                          : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                      onClick={() => handleSelectContent(c)}
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        {isCompleted ? (
                                          <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                        ) : (
                                          <Play className="h-3 w-3 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium truncate text-balance">
                                            {c.title}
                                          </div>
                                        </div>

                                        {isCurrent && (
                                          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse ml-2" />
                                        )}
                                      </div>
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Content area */}
          <section className="lg:col-span-3 space-y-6">
            {/* Video player */}
            <Card className="bg-white border-gray-200 pt-0">
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden relative" onContextMenu={(e) => e.preventDefault()}>
                  {selectedContent && selectedContent.contentType === 'VIDEO' && selectedEmbedSrc ? (
                    <>
                      <iframe
                        key={isSelectedVimeo ? `video-${videoEmbedKey}` : 'video'}
                        ref={videoFrameRef}
                        src={selectedEmbedSrc}
                        className={`w-full h-full transition-opacity ${hasOverlay ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
                        allowFullScreen
                        referrerPolicy="no-referrer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        title={selectedContent.title}
                      />
                      {hasOverlay && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/90 text-white px-6 text-center">
                          <div className="space-y-1">
                            <p className="text-lg sm:text-xl font-semibold">ชมวิดีโอนี้จบแล้ว</p>
                            <p className="text-sm text-white/80">เลือกกดดูซ้ำหรือเรียนวิดีโอต่อไปจากปุ่มด้านล่าง</p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <Button onClick={handleReplayVideo} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                              ดูอีกครั้ง
                            </Button>
                            <Button
                              onClick={handlePlayNextAvailable}
                              disabled={!nextPlayableContent}
                              variant="ghost"
                              className="text-white hover:bg-white/10 hover:text-white"
                            >
                              เล่นวิดีโอต่อไป
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>ไม่สามารถเล่นวิดีโอได้</p>
                      </div>
                    </div>
                  )}
                </div>

              
                {selectedContent && (
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold mb-1">
                          {selectedContent.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800 border border-yellow-300"
                          >
                            Chapter {currentChapter?.order}: {currentChapter?.title}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePlayNextAvailable}
                          disabled={!nextPlayableContent}
                        >
                          <Play className="h-4 w-4 mr-2" /> เล่นวิดีโอต่อไป
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => selectedContent && handleMarkCompleted(selectedContent)}
                          disabled={isCurrentCompleted || progressLoading}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isCurrentCompleted ? 'เรียนแล้ว' : progressLoading ? 'กำลังบันทึก...' : 'เรียนวิดีโอนี้จบแล้ว'}
                        </Button>
                      </div>
                    </div>

                    {/* Course summary strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Image
                          src={course.coverImageUrl || '/placeholder.svg'}
                          alt={course.title}
                          width={40}
                          height={28}
                          className="rounded object-cover border"
                        />
                        <span className="truncate" title={course.title}>{course.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> {course.stats.totalChapters} บทเรียน
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" /> {course.stats.totalContents} เนื้อหา
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="truncate">อาจารย์ {course.instructor.name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-gray-700">ความคืบหน้า</div>
                  <div className={`flex items-center gap-2 font-medium ${progressColor}`}>
                    <CheckCircle className="h-4 w-4" /> {currentProgress}%
                  </div>
                </div>
                <ProgressBar progress={currentProgress} />
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className={progressColor}>{progressText}</span>
                  {progressLoading && <span className="text-gray-500">กำลังอัพเดท...</span>}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  เรียนแล้ว {completedCount} จาก {totalContents} เนื้อหา
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!user?.id) return
                      const cid = String(courseId)
                      window.location.href = `/profile/my-courses/course/${encodeURIComponent(cid)}/exams`
                    }}
                  >
                    ทำข้อสอบของคอร์สนี้
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!user?.id) return
                      window.location.href = `/profile/my-courses/exam-results`
                    }}
                  >
                    ดูประวัติข้อสอบ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related items in current chapter */}
            {currentChapter && (
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    วิดีโออื่นๆ ใน Chapter {currentChapter.order}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...currentChapter.contents]
                      .sort((a, b) => a.order - b.order)
                      .filter((c) => c.id !== selectedContent?.id)
                      .slice(0, 6)
                      .map((c) => (
                        <Card
                          key={c.id}
                          className="cursor-pointer hover:shadow-md transition-shadow bg-gray-50 border-gray-200 hover:border-yellow-300 py-0"
                          onClick={() => handleSelectContent(c)}
                        >
                          <CardContent className="p-3">
                            <div className="aspect-video bg-gray-200 rounded mb-3 relative overflow-hidden">
                              {c.contentType === 'VIDEO' && getVideoThumbnailUrl(c.contentUrl) ? (
                                <Image
                                  src={getVideoThumbnailUrl(c.contentUrl) || '/placeholder.svg'}
                                  alt={c.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Image
                                  src={'/placeholder.svg'}
                                  alt={c.title}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <h5 className="font-medium text-sm text-gray-800 text-balance line-clamp-2">
                              {c.title}
                            </h5>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
