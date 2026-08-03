import { supabase } from './supabase'

// ── localStorage helpers ─────────────────────────────────────────────────────

const get = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : null
}

const set = (key: string, value: unknown): void =>
  localStorage.setItem(key, JSON.stringify(value))

const remove = (key: string): void => localStorage.removeItem(key)

export const storage = { get, set, remove }

// ── Supabase Storage ─────────────────────────────────────────────────────────

function getDataUrlMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,/)
  return match ? match[1] : 'image/jpeg'
}

function getExtensionForMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/jpeg') return 'jpg'
  return 'jpg'
}

function dataUrlToBlob(dataUrl: string): Blob {
  const mimeType = getDataUrlMimeType(dataUrl)
  const base64 = dataUrl.replace(/^data:image\/[^;]+;base64,/, '')
  const bytes  = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10

export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function uploadWineImage(
  dataUrl: string,
  userId: string,
  wineId: string,
  side: string
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl)
  const mimeType = getDataUrlMimeType(dataUrl)
  const extension = getExtensionForMimeType(mimeType)
  const path = `${userId}/${wineId}/${side}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('wine-labels')
    .upload(path, blob, { contentType: mimeType, upsert: true })

  if (uploadError) throw uploadError

  const { data, error: signError } = await supabase.storage
    .from('wine-labels')
    .createSignedUrl(path, TEN_YEARS_SECONDS)

  if (signError || !data) throw signError ?? new Error('No se pudo obtener la URL firmada')

  return data.signedUrl
}
