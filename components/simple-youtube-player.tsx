"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Youtube, RefreshCw } from 'lucide-react'

interface SimpleYouTubePlayerProps {
  videoId: string
  title?: string
  onError?: () => void
}

export default function SimpleYouTubePlayer({ videoId, title, onError }: SimpleYouTubePlayerProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Ultra-simple URLs to avoid Error 153
  const urls = [
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    `https://www.youtube.com/embed/${videoId}`,
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    `https://www.youtube.com/embed/${videoId}?rel=0`,
  ]

  const currentUrl = urls[currentUrlIndex]

  const handleIframeError = () => {
    console.error(`YouTube iframe failed to load: ${currentUrl}`)
    
    if (currentUrlIndex < urls.length - 1) {
      console.log(`Trying next URL: ${urls[currentUrlIndex + 1]}`)
      setCurrentUrlIndex(prev => prev + 1)
      setIsLoading(true)
    } else {
      console.error('All YouTube URLs failed')
      setHasError(true)
      setIsLoading(false)
      onError?.()
    }
  }

  const handleIframeLoad = () => {
    console.log(`YouTube iframe loaded successfully: ${currentUrl}`)
    setIsLoading(false)
    setHasError(false)
  }

  const retry = () => {
    setCurrentUrlIndex(0)
    setHasError(false)
    setIsLoading(true)
  }

  const openOnYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
  }

  if (hasError) {
    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-lg font-semibold">ไม่สามารถโหลดวิดีโอได้</div>
          <p className="text-gray-300 text-sm">
            เกิดข้อผิดพลาด Error 153 หรือปัญหาการตั้งค่าเบราว์เซอร์
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={retry}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              ลองใหม่
            </Button>
            <Button
              onClick={openOnYouTube}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Youtube className="w-4 h-4 mr-2" />
              ดูบน YouTube
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-800 rounded">
              <p>Debug: Tried {currentUrlIndex + 1}/{urls.length} URLs</p>
              <p>Last URL: {currentUrl}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">กำลังโหลดวิดีโอ...</p>
          </div>
        </div>
      )}
      <iframe
        key={`youtube-${videoId}-${currentUrlIndex}`}
        title={title ?? "YouTube video"}
        src={currentUrl}
        className="w-full h-full"
        allowFullScreen
        allow="autoplay; fullscreen"
        onError={handleIframeError}
        onLoad={handleIframeLoad}
      />
    </div>
  )
}