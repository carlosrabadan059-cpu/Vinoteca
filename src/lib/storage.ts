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

// ── Resolución de URLs de Storage ────────────────────────────────────────────
// En la BD se guardan URLs completas (firmadas o públicas) que incluyen el host
// de Supabase del momento en que se subió la imagen. Tras migrar de Supabase
// cloud a self-hosted, esas URLs apuntaban a un proyecto que ya no existe y las
// imágenes desaparecieron. Al renderizar, cualquier URL de Storage de otro host
// se reescribe contra el Supabase actual (re-firmándola si es firmada), de modo
// que una futura migración de host no vuelva a romper las imágenes.

const CURRENT_ORIGIN = new URL(import.meta.env.VITE_SUPABASE_URL as string).origin
const STORAGE_PATH_RE = /\/storage\/v1\/object\/(sign|public)\/([^/]+)\/([^?]+)/

const signedUrlCache = new Map<string, Promise<string | null>>()

function parseForeignStorageUrl(url: string) {
  let parsed: URL
  try { parsed = new URL(url) } catch { return null }
  if (parsed.origin === CURRENT_ORIGIN) return null
  const match = parsed.pathname.match(STORAGE_PATH_RE)
  if (!match) return null
  const [, kind, bucket, path] = match
  return { kind: kind as 'sign' | 'public', bucket, path: decodeURIComponent(path), search: parsed.search }
}

/** Versión síncrona: devuelve la URL utilizable si no hace falta re-firmar, o null si sí. */
export function resolveStorageUrlSync(url: string): string | null {
  const foreign = parseForeignStorageUrl(url)
  if (!foreign) return url
  if (foreign.kind === 'public') {
    return `${CURRENT_ORIGIN}/storage/v1/object/public/${foreign.bucket}/${foreign.path}${foreign.search}`
  }
  return null
}

export function resolveStorageUrl(url: string): Promise<string | null> {
  const sync = resolveStorageUrlSync(url)
  if (sync) return Promise.resolve(sync)
  const cached = signedUrlCache.get(url)
  if (cached) return cached

  const { bucket, path } = parseForeignStorageUrl(url)!
  const promise = supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS_SECONDS)
    .then(({ data }) => data?.signedUrl ?? null)
  signedUrlCache.set(url, promise)
  return promise
}

export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch((await resolveStorageUrl(url)) ?? url)
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
