import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Wine, Tasting } from '../types'

export interface StatsData {
  totalVinos: number
  totalCatas: number
  puntuacionMedia: number | null
  mejorVino: { nombre: string; puntuacion: number } | null
  distribucionTipos: { tipo: string; count: number }[]
  topRegiones: { region: string; count: number }[]
  distribucionAnadas: { decada: string; count: number }[]
  evolucionCatas: { mes: string; cantidad: number; mediaScore: number | null }[]
}

// ── Clasificación de tipo por nombre/uva ──────────────────────────────────────

const TINTOS    = ['tempranillo', 'garnacha', 'cabernet', 'merlot', 'syrah', 'malbec', 'monastrell', 'mencía', 'tinto', 'negro', 'cariñena', 'bobal', 'prieto']
const BLANCOS   = ['albariño', 'verdejo', 'chardonnay', 'sauvignon', 'riesling', 'viura', 'blanco', 'torrontés', 'godello', 'macabeo', 'moscatel', 'gewürz']
const ROSADOS   = ['rosado', 'rosé', 'clarete']
const ESPUMOSOS = ['cava', 'champagne', 'champán', 'espumoso', 'prosseco', 'prosecco', 'frizzante', 'crémant']
const DULCES    = ['dulce', 'pedro ximénez', 'px', 'moscatel', 'sauternes', 'ice wine', 'vendimia tardía']

function classifyWine(wine: Wine): string {
  const haystack = [wine.nombre, wine.uva, wine.tipo, wine.denominacion]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (ESPUMOSOS.some(k => haystack.includes(k))) return 'Espumoso'
  if (DULCES.some(k => haystack.includes(k)))    return 'Dulce'
  if (ROSADOS.some(k => haystack.includes(k)))   return 'Rosado'
  if (BLANCOS.some(k => haystack.includes(k)))   return 'Blanco'
  if (TINTOS.some(k => haystack.includes(k)))    return 'Tinto'
  return 'Sin clasificar'
}

function decadeOf(anada: number | null): string {
  if (anada === null) return 'Sin añada'
  return `${Math.floor(anada / 10) * 10}s`
}

const MES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function buildEvolucion(tastings: Tasting[]): StatsData['evolucionCatas'] {
  const now  = new Date()
  const rows: StatsData['evolucionCatas'] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mes = MES_SHORT[d.getMonth()]
    const year = d.getFullYear()
    const month = d.getMonth()

    const inMonth = tastings.filter(t => {
      const td = new Date(t.fecha)
      return td.getFullYear() === year && td.getMonth() === month
    })

    const scored = inMonth.filter(t => t.puntuacion !== null)
    const mediaScore = scored.length > 0
      ? scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length
      : null

    rows.push({ mes, cantidad: inMonth.length, mediaScore: mediaScore !== null ? Math.round(mediaScore * 10) / 10 : null })
  }

  return rows
}

// ─────────────────────────────────────────────────────────────────────────────

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

      // ── Métricas básicas ────────────────────────────────────────────────────
      const totalVinos = wines.length
      const totalCatas = tastings.length

      const scored    = tastings.filter(t => t.puntuacion !== null)
      const puntuacionMedia = scored.length > 0
        ? Math.round(scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length * 10) / 10
        : null

      let mejorVino: StatsData['mejorVino'] = null
      if (scored.length > 0) {
        const best = scored.reduce((a, b) => (b.puntuacion ?? 0) > (a.puntuacion ?? 0) ? b : a)
        const wine = wines.find(w => w.id === best.wine_id)
        if (wine) mejorVino = { nombre: wine.nombre, puntuacion: best.puntuacion! }
      }

      // ── Distribución por tipo ───────────────────────────────────────────────
      const tipoMap: Record<string, number> = {}
      wines.forEach(w => {
        const tipo = classifyWine(w)
        tipoMap[tipo] = (tipoMap[tipo] ?? 0) + 1
      })
      const distribucionTipos = Object.entries(tipoMap)
        .map(([tipo, count]) => ({ tipo, count }))
        .sort((a, b) => b.count - a.count)

      // ── Top 5 regiones ──────────────────────────────────────────────────────
      const regionMap: Record<string, number> = {}
      wines.forEach(w => {
        const region = w.region?.trim() || 'Sin región'
        regionMap[region] = (regionMap[region] ?? 0) + 1
      })
      const topRegiones = Object.entries(regionMap)
        .map(([region, count]) => ({ region, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // ── Distribución por décadas ────────────────────────────────────────────
      const decadaMap: Record<string, number> = {}
      wines.forEach(w => {
        const d = decadeOf(w.anada)
        decadaMap[d] = (decadaMap[d] ?? 0) + 1
      })
      const decadeOrder = ['1970s','1980s','1990s','2000s','2010s','2020s','Sin añada']
      const distribucionAnadas = decadeOrder
        .filter(d => decadaMap[d])
        .map(decada => ({ decada, count: decadaMap[decada] }))

      // ── Evolución de catas (6 meses) ────────────────────────────────────────
      const evolucionCatas = buildEvolucion(tastings)

      setStats({
        totalVinos,
        totalCatas,
        puntuacionMedia,
        mejorVino,
        distribucionTipos,
        topRegiones,
        distribucionAnadas,
        evolucionCatas,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [user])

  return { stats, loading, error, refresh }
}
