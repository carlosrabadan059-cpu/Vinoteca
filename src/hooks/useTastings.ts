import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { randomUUID } from '../lib/uuid'
import {
  saveTastingLocally,
  getLocalTastings,
  removeLocalTasting,
  addToQueue,
  getQueueCount,
} from '../lib/idb'
import { useTastingStore } from '../store/tastingStore'
import { useAuthStore } from '../store/authStore'
import { useSyncStore } from '../store/syncStore'
import type { Tasting, SyncOperation } from '../types'

export function useTastings(wineId?: string) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const store        = useTastingStore()
  const { user }     = useAuthStore()
  const { setPending } = useSyncStore()

  const tastings = wineId
    ? store.tastings.filter(t => t.wine_id === wineId)
    : store.tastings

  // ── Carga inicial: local inmediato → Supabase → merge ─────────────────────

  async function loadTastings(): Promise<void> {
    if (!user) return

    const raw = await getLocalTastings()
    const local = raw.map(t => ({
      es_consumo_rapido: false,
      botella_terminada: false,
      ocasion:           null,
      lugar:             null,
      ...t,
    }))
    store.setTastings(local)

    if (!navigator.onLine) return

    try {
      const { data } = await supabase
        .from('tastings')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false })

      if (!data) return

      // Los locales sin synced_at tienen prioridad (pendientes de sync)
      const localPending = local.filter(t => !(t as Tasting & { synced_at?: string }).synced_at)
      const merged = [
        ...localPending,
        ...(data as Tasting[]).filter(t => !localPending.find(l => l.id === t.id)),
      ]
      store.setTastings(merged)
    } catch {
      // datos locales ya cargados, seguimos offline
    }
  }

  async function listTastings(filterWineId?: string): Promise<Tasting[]> {
    if (!user) throw new Error('No autenticado')
    setLoading(true)
    setError(null)

    try {
      let q = supabase
        .from('tastings')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false })

      if (filterWineId) q = q.eq('wine_id', filterWineId)

      const { data, error: dbError } = await q
      if (dbError) throw dbError

      const result = (data ?? []) as Tasting[]
      store.setTastings(result)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }

  async function getTasting(id: string): Promise<Tasting | null> {
    const cached = useTastingStore.getState().tastings.find(t => t.id === id)
    if (cached) return cached

    if (!user) return null

    const { data, error: dbError } = await supabase
      .from('tastings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (dbError) return null
    return data as Tasting
  }

  async function createTasting(data: Partial<Tasting>): Promise<Tasting> {
    if (!user) throw new Error('No autenticado')

    const now = new Date().toISOString()
    const tasting: Tasting = {
      id:                randomUUID(),
      user_id:           user.id,
      wine_id:           data.wine_id           ?? '',
      fecha:             data.fecha             ?? now.slice(0, 10),
      puntuacion:        data.puntuacion        ?? null,
      notas_cata:        data.notas_cata        ?? null,
      aroma:             data.aroma             ?? null,
      color_descripcion: data.color_descripcion ?? null,
      maridaje:          data.maridaje          ?? null,
      chat_history:      data.chat_history      ?? [],
      created_at:        now,
      es_consumo_rapido: data.es_consumo_rapido ?? false,
      botella_terminada: data.botella_terminada ?? false,
      ocasion:           data.ocasion           ?? null,
      lugar:             data.lugar             ?? null,
    }

    // 1. Persistir localmente + UI optimista
    await saveTastingLocally(tasting)
    store.addTasting(tasting)

    try {
      const { data: inserted, error: dbError } = await supabase
        .from('tastings')
        .insert(tasting)
        .select()
        .single()

      if (dbError) throw dbError

      const synced = inserted as Tasting
      store.updateTasting(synced)
      await removeLocalTasting(tasting.id)
      return synced

    } catch {
      const op: SyncOperation = {
        id:         randomUUID(),
        table:      'tastings',
        action:     'insert',
        data:       tasting,
        created_at: now,
        retries:    0,
      }
      await addToQueue(op)
      setPending(await getQueueCount())
      return tasting
    }
  }

  async function updateTasting(id: string, data: Partial<Tasting>): Promise<Tasting> {
    const prev = useTastingStore.getState().tastings.find(t => t.id === id)
    if (prev) {
      const updated = { ...prev, ...data }
      store.updateTasting(updated)
      await saveTastingLocally(updated)
    }

    try {
      const { data: updated, error: dbError } = await supabase
        .from('tastings')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (dbError) throw dbError

      const synced = updated as Tasting
      store.updateTasting(synced)
      await removeLocalTasting(id)
      return synced

    } catch {
      if (prev) {
        const op: SyncOperation = {
          id:         randomUUID(),
          table:      'tastings',
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

  async function deleteTasting(id: string): Promise<void> {
    const prev = useTastingStore.getState().tastings.find(t => t.id === id)
    store.removeTasting(id)
    await removeLocalTasting(id)

    try {
      const { error: dbError } = await supabase.from('tastings').delete().eq('id', id)
      if (dbError) throw dbError

    } catch {
      if (prev) {
        store.addTasting(prev)
        await saveTastingLocally(prev)
        const op: SyncOperation = {
          id:         randomUUID(),
          table:      'tastings',
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

  return { tastings, loading, error, loadTastings, listTastings, getTasting, createTasting, updateTasting, deleteTasting }
}
