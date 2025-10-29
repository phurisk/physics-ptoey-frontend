/**
 * YouTube utility functions for handling video validation and error handling
 */

export function validateYouTubeId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // YouTube video IDs are exactly 11 characters long and contain only alphanumeric characters, hyphens, and underscores
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return false;
  
  // Additional validation: should not be all the same character or obvious invalid patterns
  if (/^(.)\1{10}$/.test(id)) return false; // All same character
  if (id === '00000000000' || id === '___________' || id === '-----------') return false;
  
  return true;
}

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && validateYouTubeId(match[1])) {
      return match[1];
    }
  }

  return null;
}

export function createYouTubeEmbedUrl(videoId: string, options: {
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
  enablejsapi?: boolean;
  playsinline?: boolean;
  origin?: string;
} = {}): string {
  if (!validateYouTubeId(videoId)) {
    throw new Error('Invalid YouTube video ID');
  }

  const params = new URLSearchParams({
    rel: options.rel ? '1' : '0',
    modestbranding: options.modestbranding !== false ? '1' : '0',
    enablejsapi: options.enablejsapi !== false ? '1' : '0',
    playsinline: options.playsinline !== false ? '1' : '0',
    controls: options.controls !== false ? '1' : '0',
  });

  if (options.autoplay) params.set('autoplay', '1');
  if (options.mute) params.set('mute', '1');
  if (options.origin) params.set('origin', options.origin);

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export async function checkYouTubeVideoExists(videoId: string): Promise<{exists: boolean, error?: string}> {
  if (!validateYouTubeId(videoId)) {
    return { exists: false, error: 'Invalid video ID format' };
  }
  
  try {
    // Method 1: Try oEmbed API
    const oembedResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { method: 'GET', mode: 'cors' }
    );
    
    if (oembedResponse.ok) {
      const data = await oembedResponse.json();
      return { exists: true };
    }
    
    // Method 2: Try thumbnail check as fallback
    const thumbnailResponse = await fetch(
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      { method: 'HEAD', mode: 'no-cors' }
    );
    
    return { exists: true }; // If we get here, assume it exists
    
  } catch (error) {
    console.warn('YouTube video check failed:', error);
    return { exists: false, error: 'Network error or video not accessible' };
  }
}

export function createMultipleFallbackUrls(videoId: string): string[] {
  if (!validateYouTubeId(videoId)) return [];
  
  return [
    // Primary: Simple autoplay
    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    
    // Fallback 1: No autoplay
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    
    // Fallback 2: Regular YouTube with autoplay
    `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
    
    // Fallback 3: Regular YouTube no autoplay
    `https://www.youtube.com/embed/${videoId}?rel=0`,
    
    // Fallback 4: Absolute minimal nocookie
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    
    // Fallback 5: Absolute minimal regular
    `https://www.youtube.com/embed/${videoId}`,
    
    // Fallback 6: With controls only
    `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0`,
    
    // Fallback 7: Last resort with basic params
    `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1`
  ];
}

export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string {
  if (!validateYouTubeId(videoId)) {
    return '/placeholder.svg?height=200&width=350';
  }
  
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}