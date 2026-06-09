import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadWineImage, fetchImageAsDataUrl } from '../lib/storage'
import {
  saveWineLocally,
  getLocalWines,
  removeLocalWine,
  addToQueue,
  getQueueCount,
} from '../lib/idb'
import { useWineStore } from '../store/wineStore'
import { useAuthStore } from '../store/authStore'
import { useSyncStore } from '../store/syncStore'
import type { Wine, SyncOperation } from '../types'

export interface WineFilters {
  tipo?: string
  region?: string
  query?: string
  page?: number
}

const PAGE_SIZE = 20

export function useWines() {
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const { wines, addWine, setWines, setTotal } = useWineStore()
  const { user }                               = useAuthStore()
  const { setPending }                         = useSyncStore()

  // ── Carga inicial: local inmediato → Supabase → merge ─────────────────────

  async function loadWines(): Promise<void> {
    if (!user) return

    const local = await getLocalWines()
    setWines(local)

    if (!navigator.onLine) return

    try {
      const { data } = await supabase
        .from('wines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!data) return

      const localPending = local.filter(w => !w.synced_at)
      const merged = [
        ...localPending,
        ...(data as Wine[]).filter(w => !localPending.find(l => l.id === w.id)),
      ]
      setWines(merged)
    } catch {
      // datos locales ya cargados, seguimos offline
    }
  }

  async function listWines(filters: WineFilters = {}): Promise<Wine[]> {
    if (!user) throw new Error('No autenticado')

    const { query, page = 0 } = filters
    const from = page * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase
      .from('wines')
      .select('*', page === 0 ? { count: 'exact' } : undefined)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (query?.trim()) {
      const safe = query.trim().replace(/[%_]/g, '\\$&')
      q = q.or(`nombre.ilike.%${safe}%,bodega.ilike.%${safe}%,region.ilike.%${safe}%`)
    }

    const { data, count, error: dbError } = await q
    if (dbError) throw dbError

    if (page === 0 && count !== null) setTotal(count)
    return (data ?? []) as Wine[]
  }

  async function getWine(id: string): Promise<Wine | null> {
    const cached = useWineStore.getState().wines.find(w => w.id === id)
    if (cached) return cached

    if (!user) return null

    const { data, error: dbError } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (dbError) return null
    return data as Wine
  }

  async function createWine(
    data: Partial<Wine>,
    images: { frontal?: string; trasera?: string } = {}
  ): Promise<Wine> {
    if (!user) throw new Error('No autenticado')

    setLoading(true)
    setError(null)

    const id  = crypto.randomUUID()
    const now = new Date().toISOString()

    const wine: Wine = {
      id,
      user_id:            user.id,
      nombre:             data.nombre       ?? '',
      bodega:             data.bodega       ?? null,
      anada:              data.anada        ?? null,
      region:             data.region       ?? null,
      denominacion:       data.denominacion ?? null,
      uva:                data.uva          ?? null,
      tipo:               data.tipo         ?? null,
      imagen_frontal_url: null,
      imagen_trasera_url: null,
      created_at:         now,
      synced_at:          null,
    }

    // 1. Persistir localmente + UI optimista
    await saveWineLocally(wine)
    addWine(wine)

    try {
      let imagenFrontalUrl: string | null = null
      let imagenTraseraUrl: string | null = null

      if (images.frontal || images.trasera) {
        setStatus('Subiendo imágenes...')
        if (images.frontal) {
          const frontalData = images.frontal.startsWith('http')
            ? await fetchImageAsDataUrl(images.frontal)
            : images.frontal
          imagenFrontalUrl = await uploadWineImage(frontalData, user.id, id, 'frontal')
        }
        if (images.trasera) imagenTraseraUrl = await uploadWineImage(images.trasera, user.id, id, 'trasera')
      }

      const wineWithImages: Wine = { ...wine, imagen_frontal_url: imagenFrontalUrl, imagen_trasera_url: imagenTraseraUrl }

      setStatus('Guardando en tu bodega...')
      const { error: dbError } = await supabase.from('wines').insert(wineWithImages)
      if (dbError) throw dbError

      // Sync exitoso: limpiar copia local y marcar synced
      await removeLocalWine(id)
      const synced: Wine = { ...wineWithImages, synced_at: now }
      useWineStore.getState().updateWine(synced)
      return synced

    } catch {
      // Encolar para sync posterior
      const op: SyncOperation = {
        id:         crypto.randomUUID(),
        table:      'wines',
        action:     'insert',
        data:       wine,
        created_at: now,
        retries:    0,
      }
      await addToQueue(op)
      setPending(await getQueueCount())
      setError('offline')
      return wine

    } finally {
      setLoading(false)
      setStatus(null)
    }
  }

  async function updateWine(id: string, data: Partial<Wine>): Promise<Wine> {
    const store = useWineStore.getState()
    const prev  = store.wines.find(w => w.id === id)

    if (prev) {
      const updated = { ...prev, ...data }
      store.updateWine(updated)
      await saveWineLocally(updated)
    }

    try {
      const { data: updated, error: dbError } = await supabase
        .from('wines')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (dbError) throw dbError

      const synced = updated as Wine
      store.updateWine(synced)
      await removeLocalWine(id)
      return synced

    } catch {
      if (prev) {
        const op: SyncOperation = {
          id:         crypto.randomUUID(),
          table:      'wines',
          action:     'update',
          data:       { ...prev, ...data },
          created_at: new Date().toISOString(),
          retries:    0,
        }
        await addToQueue(op)
        setPending(await getQueueCount())
      }
      return { ...prev!, ...data }
    }
  }

  async function deleteWine(id: string): Promise<void> {
    const store = useWineStore.getState()
    const prev  = store.wines.find(w => w.id === id)

    store.removeWine(id)
    await removeLocalWine(id)

    try {
      const { error: dbError } = await supabase.from('wines').delete().eq('id', id)
      if (dbError) throw dbError

    } catch {
      if (prev) {
        store.addWine(prev)
        await saveWineLocally(prev)
        const op: SyncOperation = {
          id:         crypto.randomUUID(),
          table:      'wines',
          action:     'delete',
          data:       { id },
          created_at: new Date().toISOString(),
          retries:    0,
        }
        await addToQueue(op)
        setPending(await getQueueCount())
      }
    }
  }

  async function searchWines(query: string): Promise<Wine[]> {
    if (!user) return []

    // Offline: buscar en store local
    if (!navigator.onLine) {
      const safe = query.trim().toLowerCase()
      return useWineStore.getState().wines.filter(w =>
        w.nombre.toLowerCase().includes(safe) ||
        w.bodega?.toLowerCase().includes(safe) ||
        w.region?.toLowerCase().includes(safe)
      )
    }

    const safe = query.trim().replace(/[%_]/g, '\\$&')
    const { data, error: dbError } = await supabase
      .from('wines')
      .select('*')
      .eq('user_id', user.id)
      .or(`nombre.ilike.%${safe}%,bodega.ilike.%${safe}%,region.ilike.%${safe}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (dbError) throw dbError
    return (data ?? []) as Wine[]
  }

  return { wines, loading, status, error, loadWines, createWine, listWines, getWine, updateWine, deleteWine, searchWines }
}
