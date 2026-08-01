import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Wine, Tasting } from '../types'
import {
  computeValorEstimado,
  computeTotalBotellas,
  computeDistribucionPorCampo,
  computeDistribucionTipos,
  computeDistribucionAnadas,
  computePuntuacionMedia,
  computeMejorVino,
  buildEvolucion,
  type DistribucionEntry,
  type TipoEntry,
  type DecadaEntry,
  type EvolucionRow,
  type MejorVino,
} from '../lib/statsHelpers'

export interface StatsData {
  totalVinos: number
  totalBotellas: number
  valorEstimado: number
  totalCatas: number
  puntuacionMedia: number | null
  mejorVino: MejorVino | null
  distribucionTipos: TipoEntry[]
  topRegiones: DistribucionEntry[]
  distribucionUva: DistribucionEntry[]
  distribucionBodega: DistribucionEntry[]
  distribucionAnadas: DecadaEntry[]
  evolucionCatas: EvolucionRow[]
}

export function useStats() {
  const [stats,   setStats]   = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const { user } = useAuthStore()

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const [winesRes, tastingsRes] = await Promise.all([
        supabase.from('wines').select('*').eq('user_id', user.id),
        supabase.from('tastings').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
      ])

      if (winesRes.error)    throw winesRes.error
      if (tastingsRes.error) throw tastingsRes.error

      const wines    = (winesRes.data    ?? []) as Wine[]
      const tastings = (tastingsRes.data ?? []) as Tasting[]

      setStats({
        totalVinos:         wines.length,
        totalBotellas:      computeTotalBotellas(wines),
        valorEstimado:      computeValorEstimado(wines),
        totalCatas:         tastings.length,
        puntuacionMedia:    computePuntuacionMedia(tastings),
        mejorVino:          computeMejorVino(wines, tastings),
        distribucionTipos:  computeDistribucionTipos(wines),
        topRegiones:        computeDistribucionPorCampo(wines, 'region', 'Sin región'),
        distribucionUva:    computeDistribucionPorCampo(wines, 'uva', 'Sin uva especificada'),
        distribucionBodega: computeDistribucionPorCampo(wines, 'bodega', 'Sin bodega'),
        distribucionAnadas: computeDistribucionAnadas(wines),
        evolucionCatas:     buildEvolucion(tastings),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [user])

  return { stats, loading, error, refresh }
}
