import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'
import http from '@/lib/http'

export interface ProgressData {
  progress: number
  status: string
  completedContents: string[]
  lastAccessedAt: string
}

export interface ProgressResponse {
  success: boolean
  data: ProgressData
  message?: string
}

export function useProgress(initialProgress: number = 0) {
  const [progress, setProgress] = useState(initialProgress)
  const [loading, setLoading] = useState(false)

  const updateProgress = useCallback(async (userId: string, courseId: string, contentId: string) => {
    setLoading(true)
    try {
      const response = await http.post('/api/update-progress', {
        userId,
        courseId,
        contentId,
      })
      const result = response.data
      if (result.success) {
        setProgress(result.data?.progress || progress)
        return result.data
      } else {
        throw new Error(result.message || 'Failed to update progress')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      toast({ title: 'อัพเดทความคืบหน้าไม่สำเร็จ', description: (error as any)?.message ?? 'ลองใหม่อีกครั้ง', variant: 'destructive' as any })
      throw error
    } finally {
      setLoading(false)
    }
  }, [progress])

  const getProgress = useCallback(async (userId: string, courseId: string) => {
    setLoading(true)
    try {
      const response = await http.get(`/api/progress`, { params: { userId, courseId } })
      const result = response.data
      
      if (result.success) {
        setProgress(result.data?.progress || 0)
        return result.data
      } else {
        throw new Error(result.message || 'Failed to get progress')
      }
    } catch (error) {
      console.error('Error getting progress:', error)
      toast({ title: 'โหลดความคืบหน้าไม่สำเร็จ', description: (error as any)?.message ?? 'ลองใหม่อีกครั้ง', variant: 'destructive' as any })
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const resetProgress = useCallback(async (userId: string, courseId: string) => {
    setLoading(true)
    try {
      const response = await http.delete(`/api/progress`, { params: { userId, courseId } })
      const result = response.data
      if (result.success) {
        setProgress(0)
        toast({ title: 'รีเซ็ตความคืบหน้าแล้ว' })
        return result.data
      } else {
        throw new Error(result.message || 'Failed to reset progress')
      }
    } catch (error) {
      console.error('Error resetting progress:', error)
      toast({ title: 'รีเซ็ตความคืบหน้าไม่สำเร็จ', description: (error as any)?.message ?? 'ลองใหม่อีกครั้ง', variant: 'destructive' as any })
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const progressText = progress === 0 
    ? 'ยังไม่ได้เริ่มเรียน'
    : progress < 25 
    ? 'เริ่มต้น'
    : progress < 50 
    ? 'กำลังเรียน'
    : progress < 75 
    ? 'เรียนแล้วครึ่งหนึ่ง'
    : progress < 100 
    ? 'เกือบจบแล้ว'
    : 'เรียนจบแล้ว'

  const progressColor = progress === 0 
    ? 'text-gray-500'
    : progress < 50 
    ? 'text-yellow-600'
    : progress < 100 
    ? 'text-blue-600'
    : 'text-green-600'

  return {
    progress,
    loading,
    updateProgress,
    getProgress,
    resetProgress,
    progressText,
    progressColor,
  }
}

export const calculateProgress = (completedContents: string[], totalContents: number): number => {
  if (totalContents === 0) return 0
  return Math.round((completedContents.length / totalContents) * 100)
}

export const getProgressStatus = (progress: number): string => {
  if (progress === 0) return 'NOT_STARTED'
  if (progress < 100) return 'IN_PROGRESS'
  return 'COMPLETED'
}
