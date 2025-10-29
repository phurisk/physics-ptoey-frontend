/**
 * Special handling for YouTube embeds on localhost/development
 * YouTube often blocks embeds on localhost due to security policies
 */

export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         hostname.endsWith('.local');
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || isLocalhost();
}

export function createLocalhostFriendlyYouTubeUrls(videoId: string): string[] {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return [];
  
  // Special URLs that work better on localhost
  return [
    // Method 1: Absolute minimal (best for localhost)
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    
    // Method 2: Regular domain (sometimes bypasses localhost restrictions)
    `https://www.youtube.com/embed/${videoId}`,
    
    // Method 3: Force no cookies and minimal tracking
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3`,
    
    // Method 4: Different parameter combination
    `https://www.youtube.com/embed/${videoId}?rel=0&controls=1&showinfo=0&iv_load_policy=3`,
    
    // Method 5: HTML5 player (sometimes works on localhost)
    `https://www.youtube-nocookie.com/embed/${videoId}?html5=1&rel=0&modestbranding=1`,
    
    // Method 6: Disable annotations and info
    `https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&cc_load_policy=0`,
    
    // Method 7: Last resort with all privacy settings
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&cc_load_policy=0&disablekb=1`
  ];
}

export function getYouTubeErrorMessage(isDev: boolean): {
  title: string;
  message: string;
  suggestion: string;
} {
  if (isDev) {
    return {
      title: 'YouTube Embed ไม่ทำงานใน Development',
      message: 'YouTube มักจะบล็อก embed ใน localhost เพื่อความปลอดภัย',
      suggestion: 'ปัญหานี้จะหายไปเมื่อ deploy ไปยัง production server หรือใช้ domain จริง'
    };
  }
  
  return {
    title: 'ไม่สามารถโหลดวิดีโอได้',
    message: 'เกิดข้อผิดพลาดในการโหลดวิดีโอ YouTube',
    suggestion: 'กรุณาลองใหม่อีกครั้ง หรือดูวิดีโอบน YouTube โดยตรง'
  };
}

export function shouldShowDevelopmentWarning(): boolean {
  return isDevelopment() && typeof window !== 'undefined';
}