"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  validateYouTubeId, 
  extractYouTubeId, 
  createMultipleFallbackUrls, 
  checkYouTubeVideoExists,
  getYouTubeThumbnailUrl 
} from '@/lib/youtube-utils'

export default function YouTubeDebug() {
  const [testUrl, setTestUrl] = useState('https://www.youtube.com/watch?v=FmpwK4x-Heg')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testYouTubeUrl = async () => {
    setLoading(true)
    setResults(null)

    try {
      const extractedId = extractYouTubeId(testUrl)
      const isValidId = extractedId ? validateYouTubeId(extractedId) : false
      const fallbackUrls = extractedId ? createMultipleFallbackUrls(extractedId) : []
      const existsCheck = extractedId ? await checkYouTubeVideoExists(extractedId) : { exists: false, error: 'No ID extracted' }
      const thumbnailUrl = extractedId ? getYouTubeThumbnailUrl(extractedId) : null

      setResults({
        originalUrl: testUrl,
        extractedId,
        isValidId,
        existsCheck,
        fallbackUrls,
        thumbnailUrl
      })
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>YouTube URL Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter YouTube URL to test"
            className="flex-1"
          />
          <Button onClick={testYouTubeUrl} disabled={loading}>
            {loading ? 'Testing...' : 'Test URL'}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {results.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 font-semibold">Error: {results.error}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Basic Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Original URL:</span>
                        <p className="break-all text-gray-600">{results.originalUrl}</p>
                      </div>
                      <div>
                        <span className="font-medium">Extracted ID:</span>
                        <p className="font-mono">{results.extractedId || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Valid ID:</span>
                        <Badge variant={results.isValidId ? 'default' : 'destructive'}>
                          {results.isValidId ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Video Exists:</span>
                        <Badge variant={results.existsCheck.exists ? 'default' : 'destructive'}>
                          {results.existsCheck.exists ? 'Yes' : 'No'}
                        </Badge>
                        {results.existsCheck.error && (
                          <p className="text-red-600 text-xs mt-1">{results.existsCheck.error}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Thumbnail Test</h3>
                    {results.thumbnailUrl && (
                      <img 
                        src={results.thumbnailUrl} 
                        alt="YouTube thumbnail"
                        className="w-full max-w-xs rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.border = '2px solid red';
                          target.alt = 'Thumbnail failed to load';
                        }}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Fallback URLs ({results.fallbackUrls.length})</h3>
                  <div className="space-y-2">
                    {results.fallbackUrls.map((url: string, index: number) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Option {index + 1}:</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(url, '_blank')}
                          >
                            Test
                          </Button>
                        </div>
                        <p className="break-all text-gray-600 mt-1">{url}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}