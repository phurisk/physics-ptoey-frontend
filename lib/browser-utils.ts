/**
 * Browser compatibility utilities for YouTube embed
 */

export function getBrowserInfo() {
  if (typeof window === 'undefined') return null;
  
  const userAgent = window.navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(window.navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  
  return {
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    userAgent,
    supportsPartitionedCookies: isChrome || isEdge, // Chrome and Edge support partitioned cookies
  };
}

export function getOptimalYouTubeParams(videoId: string) {
  const browser = getBrowserInfo();
  
  // Keep it simple to avoid Error 153
  const baseParams = {
    rel: '0', // No related videos
  };
  
  if (!browser) {
    return baseParams;
  }
  
  // Only add minimal params based on browser
  if (browser.isChrome || browser.isEdge) {
    // These browsers handle more params better
    return {
      ...baseParams,
      modestbranding: '1',
    };
  }
  
  // For all other browsers, keep it minimal
  return baseParams;
}

export function createBrowserOptimizedYouTubeUrl(videoId: string, options: {
  autoplay?: boolean;
  domain?: 'youtube.com' | 'youtube-nocookie.com';
} = {}): string {
  const { autoplay = false, domain = 'youtube-nocookie.com' } = options;
  const params = getOptimalYouTubeParams(videoId);
  
  if (autoplay) {
    params.autoplay = '1';
  }
  
  const queryString = new URLSearchParams(params).toString();
  return `https://www.${domain}/embed/${videoId}?${queryString}`;
}