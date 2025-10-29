"use client"

import YouTubeDebug from '@/components/youtube-debug'

export default function YouTubeDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">YouTube Debug Tool</h1>
        <YouTubeDebug />
      </div>
    </div>
  )
}