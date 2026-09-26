import { useEffect, useState } from 'react'
import { resolveStorageUrl, resolveStorageUrlSync } from '../lib/storage'

/**
 * Devuelve una URL de imagen de Storage utilizable contra el Supabase actual.
 * Las URLs del host actual pasan tal cual (sin coste); las de otro host se
 * reescriben o re-firman — ver resolveStorageUrl en lib/storage.ts.
 */
export function useStorageUrl(url: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(() => (url ? resolveStorageUrlSync(url) : null))

  useEffect(() => {
    if (!url) { setResolved(null); return }
    const sync = resolveStorageUrlSync(url)
    setResolved(sync)
    if (sync) return

    let cancelled = false
    resolveStorageUrl(url).then(r => { if (!cancelled) setResolved(r) })
    return () => { cancelled = true }
  }, [url])

  return resolved
}
