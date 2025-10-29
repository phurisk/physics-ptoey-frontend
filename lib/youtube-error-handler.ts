/**
 * YouTube Error 153 Handler
 * Error 153 typically occurs due to:
 * 1. Invalid player configuration
 * 2. CORS issues
 * 3. Autoplay restrictions
 * 4. JavaScript API configuration problems
 */

export interface YouTubeErrorInfo {
  code: number
  message: string
  suggestions: string[]
}

export const YOUTUBE_ERRORS: Record<number, YouTubeErrorInfo> = {
  2: {
    code: 2,
    message: 'Invalid parameter value',
    suggestions: [
      'Check video ID format',
      'Verify URL parameters',
      'Remove invalid parameters'
    ]
  },
  5: {
    code: 5,
    message: 'HTML5 player error',
    suggestions: [
      'Try different browser',
      'Clear browser cache',
      'Disable browser extensions'
    ]
  },
  100: {
    code: 100,
    message: 'Video not found or private',
    suggestions: [
      'Check if video exists',
      'Verify video is public',
      'Contact video owner'
    ]
  },
  101: {
    code: 101,
    message: 'Embedding disabled by video owner',
    suggestions: [
      'Contact video owner',
      'Use direct YouTube link',
      'Find alternative video'
    ]
  },
  150: {
    code: 150,
    message: 'Embedding disabled by video owner',
    suggestions: [
      'Contact video owner',
      'Use direct YouTube link',
      'Find alternative video'
    ]
  },
  153: {
    code: 153,
    message: 'Video player configuration error',
    suggestions: [
      'Remove autoplay parameter',
      'Disable JavaScript API',
      'Use minimal URL parameters',
      'Try different domain (youtube.com vs youtube-nocookie.com)',
      'Check CORS settings',
      'Verify iframe sandbox attributes'
    ]
  }
}

export function getYouTubeErrorInfo(errorCode: number): YouTubeErrorInfo {
  return YOUTUBE_ERRORS[errorCode] || {
    code: errorCode,
    message: `Unknown YouTube error (${errorCode})`,
    suggestions: [
      'Try refreshing the page',
      'Use direct YouTube link',
      'Contact support'
    ]
  }
}

export function createError153FixedUrls(videoId: string): string[] {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return []
  
  // Ultra-simple URLs designed specifically to avoid Error 153
  return [
    // Method 1: Absolute minimal - just the video
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    
    // Method 2: Only rel=0 (no related videos)
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    
    // Method 3: Regular YouTube domain, minimal
    `https://www.youtube.com/embed/${videoId}`,
    
    // Method 4: Regular YouTube with rel=0 only
    `https://www.youtube.com/embed/${videoId}?rel=0`,
    
    // Method 5: Add controls only
    `https://www.youtube-nocookie.com/embed/${videoId}?controls=1`,
    
    // Method 6: Most basic working combination
    `https://www.youtube.com/embed/${videoId}?controls=1&rel=0`
  ]
}

export function handleYouTubeError(
  errorCode: number, 
  currentUrlIndex: number, 
  fallbackUrls: string[],
  onNextUrl: () => void,
  onAllFailed: () => void
): void {
  const errorInfo = getYouTubeErrorInfo(errorCode)
  
  console.error(`YouTube Error ${errorCode}: ${errorInfo.message}`)
  console.log('Suggestions:', errorInfo.suggestions)
  
  // For Error 153, try specific fixes
  if (errorCode === 153) {
    console.log('Applying Error 153 specific fixes...')
    
    // Wait a bit before trying next URL to avoid rapid failures
    setTimeout(() => {
      if (currentUrlIndex < fallbackUrls.length - 1) {
        onNextUrl()
      } else {
        onAllFailed()
      }
    }, 2000)
  } else {
    // For other errors, try next URL immediately
    if (currentUrlIndex < fallbackUrls.length - 1) {
      onNextUrl()
    } else {
      onAllFailed()
    }
  }
}