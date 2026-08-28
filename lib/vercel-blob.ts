import { put } from "@vercel/blob"

export function validateFile(file: File, allowedTypes: string[] = []): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`)
  }
  return { isValid: errors.length === 0, errors }
}

export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : ""
  const base = originalName.slice(0, originalName.length - ext.length).replace(/[^a-zA-Z0-9-_]/g, "_")
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${base}-${unique}${ext}`
}

export async function uploadToVercelBlob(file: File, pathname: string) {
  const blob = await put(pathname, file, { access: "public" })
  return { url: blob.url, pathname: blob.pathname }
}
