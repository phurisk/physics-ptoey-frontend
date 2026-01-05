/**
 * Image compression and conversion utilities
 * Converts images to WebP format and compresses them before upload
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-1
  convertToWebP?: boolean
}

/**
 * Compress and optionally convert image to WebP
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    convertToWebP = true,
  } = options

  console.log(`🔄 Starting compression: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      console.error('❌ FileReader error')
      reject(new Error('Failed to read file'))
    }
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onerror = () => {
        console.error('❌ Image load error')
        reject(new Error('Failed to load image'))
      }
      
      img.onload = () => {
        try {
          console.log(`📐 Original dimensions: ${img.width}x${img.height}`)
          
          // Calculate new dimensions (more aggressive for large images)
          let { width, height } = img
          
          // Force resize for payment slips (usually don't need to be huge)
          const targetMaxWidth = Math.min(maxWidth, 1280)
          const targetMaxHeight = Math.min(maxHeight, 1280)
          
          if (width > targetMaxWidth || height > targetMaxHeight) {
            const ratio = Math.min(targetMaxWidth / width, targetMaxHeight / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
            console.log(`📏 Resizing to: ${width}x${height}`)
          } else {
            console.log(`✓ No resize needed`)
          }

          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d', { alpha: false })
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Fill white background (for transparency)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)

          // Draw image with better quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Adjust quality based on file size target
          let finalQuality = quality
          const estimatedSize = (width * height * 3) / 8 // rough estimate
          if (estimatedSize > 500000) { // if > 500KB estimated
            finalQuality = Math.min(quality, 0.75)
            console.log(`⚡ Reducing quality to ${finalQuality} for large image`)
          }

          // Convert to blob
          const mimeType = convertToWebP ? 'image/webp' : 'image/jpeg'
          console.log(`🔧 Converting to ${mimeType} with quality ${finalQuality}`)
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error('❌ Canvas toBlob failed')
                reject(new Error('Failed to compress image'))
                return
              }

              // Create new file
              const fileExtension = convertToWebP ? 'webp' : 'jpg'
              const fileName = file.name.replace(/\.[^.]+$/, `.${fileExtension}`)
              
              const compressedFile = new File([blob], fileName, {
                type: mimeType,
                lastModified: Date.now(),
              })

              const originalKB = (file.size / 1024).toFixed(1)
              const compressedKB = (compressedFile.size / 1024).toFixed(1)
              const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
              
              console.log(`✅ Compression complete: ${originalKB}KB → ${compressedKB}KB (${reduction}% reduction)`)
              resolve(compressedFile)
            },
            mimeType,
            finalQuality
          )
        } catch (error) {
          console.error('❌ Compression error:', error)
          reject(error)
        }
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validate and compress image file
 */
export async function validateAndCompressImage(
  file: File | null,
  options: CompressOptions & { maxSizeMB?: number } = {}
): Promise<{ success: boolean; file?: File; error?: string }> {
  if (!file) {
    return { success: false, error: 'ไม่มีไฟล์' }
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' }
  }

  const maxSizeMB = options.maxSizeMB || 10
  const originalSizeMB = file.size / (1024 * 1024)

  console.log(`📋 Validating: ${file.name} (${originalSizeMB.toFixed(2)}MB)`)

  try {
    // Check if browser supports WebP
    const supportsWebP = document.createElement('canvas')
      .toDataURL('image/webp')
      .startsWith('data:image/webp')
    
    if (!supportsWebP && options.convertToWebP) {
      console.warn('⚠️ WebP not supported, using JPEG instead')
      options.convertToWebP = false
    }

    // Compress image
    const compressedFile = await compressImage(file, options)

    // Check size after compression
    const sizeMB = compressedFile.size / (1024 * 1024)
    console.log(`📊 Final size: ${sizeMB.toFixed(2)}MB / ${maxSizeMB}MB limit`)
    
    if (sizeMB > maxSizeMB) {
      return {
        success: false,
        error: `ไฟล์ใหญ่เกินไป (${sizeMB.toFixed(1)}MB) กรุณาเลือกไฟล์ที่เล็กกว่า ${maxSizeMB}MB`,
      }
    }

    return { success: true, file: compressedFile }
  } catch (error) {
    console.error('❌ Image compression error:', error)
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ',
    }
  }
}
