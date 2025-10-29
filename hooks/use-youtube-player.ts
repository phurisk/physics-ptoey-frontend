"use client"

import { useState, useEffect, useCallback } from 'react'
import { validateYouTubeId, createYouTubeEmbedUrl } from '@/lib/youtube-utils'

interface UseYouTubePlayerOptions {
  videoId: string | null
  autoplay?: boolean
  mute?: boolean
  onError?: (error: Error) => void
  onReady?: () => void
}

interface UseYouTubePlayerReturn {
  embedUrl: string | null
  isLoading: boolean
  hasError: boolean
  retry: () => void
  openOnYouTube: () => void
}

export function useYouTubePlayer({
  videoId,
  autoplay = false,
  mute = false,
  onError,
  onReady
}: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const generateEmbedUrl = useCallback(() => {
    if (!videoId || !validateYouTubeId(videoId)) {
      setHasError(true)
      onError?.(new Error('Invalid YouTube video ID'))
      return null
    }

    try {
      return createYouTubeEmbedUrl(videoId, {
        autoplay,
        mute,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined
      })
    } catch (error) {
      setHasError(true)
      onError?.(error as Error)
      return null
    }
  }, [videoId, autoplay, mute, onError])

  const retry = useCallback(() => {
    if (retryCount >= 3) {
      setHasError(true)
      onError?.(new Error('Maximum retry attempts reached'))
      return
    }

    setIsLoading(true)
    setHasError(false)
    setRetryCount(prev => prev + 1)

    // Add a small delay before retry
    setTimeout(() => {
      const url = generateEmbedUrl()
      setEmbedUrl(url)
      setIsLoading(false)
      
      if (url) {
        onReady?.()
      }
    }, 1000 * retryCount) // Exponential backoff
  }, [retryCount, generateEmbedUrl, onError, onReady])

  const openOnYouTube = useCallback(() => {
    if (videoId && validateYouTubeId(videoId)) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
    }
  }, [videoId])

  useEffect(() => {
    if (!videoId) {
      setEmbedUrl(null)
      setHasError(false)
      setIsLoading(false)
      setRetryCount(0)
      return
    }

    setIsLoading(true)
    setHasError(false)
    setRetryCount(0)

    const url = generateEmbedUrl()
    setEmbedUrl(url)
    setIsLoading(false)

    if (url) {
      onReady?.()
    }
  }, [videoId, generateEmbedUrl, onReady])

  return {
    embedUrl,
    isLoading,
    hasError,
    retry,
    openOnYouTube
  }
}