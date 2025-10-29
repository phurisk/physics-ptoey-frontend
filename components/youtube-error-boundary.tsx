"use client"

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  youtubeId?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class YouTubeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('YouTube Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-6">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-lg font-semibold">เกิดข้อผิดพลาดในการโหลดวิดีโอ</div>
            <p className="text-gray-300 text-sm">
              อาจเป็นเพราะปัญหาการเชื่อมต่อหรือการตั้งค่าเบราว์เซอร์
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false })}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                ลองใหม่
              </Button>
              {this.props.youtubeId && (
                <Button
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${this.props.youtubeId}`, '_blank')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Youtube className="w-4 h-4 mr-2" />
                  ดูบน YouTube
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default YouTubeErrorBoundary