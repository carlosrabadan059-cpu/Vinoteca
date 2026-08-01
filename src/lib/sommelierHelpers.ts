import type { Wine, Tasting } from '../types'
import { classifyWine } from './statsHelpers'

export interface TasteProfile {
  vinosMejorValorados: { nombre: string; puntuacion: number }[]
  tipoPreferido: string | null
  regionesPreferidas: string[]
  puntuacionMediaGeneral: number | null
  ocasionesFrecuentes: string[]
}

const MIN_CATAS_TIPO = 2

export function buildTasteProfile(wines: Wine[], tastings: Tasting[]): TasteProfile {
  const scored = tastings.filter(t => t.puntuacion !== null)

  if (scored.length === 0) {
    return {
      vinosMejorValorados:    [],
      tipoPreferido:          null,
      regionesPreferidas:     [],
      puntuacionMediaGeneral: null,
      ocasionesFrecuentes:    [],
    }
  }

  const wineById = new Map(wines.map(w => [w.id, w]))

  // ── Vinos mejor valorados (top 5) ────────────────────────────────────────
  const vinosMejorValorados = [...scored]
    .sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0))
    .slice(0, 5)
    .map(t => {
      const wine = wineById.get(t.wine_id)
      return { nombre: wine?.nombre ?? 'Vino desconocido', puntuacion: t.puntuacion ?? 0 }
    })

  // ── Tipo preferido (mín. MIN_CATAS_TIPO catas de ese tipo) ──────────────
  const tipoScores: Record<string, { sum: number; count: number }> = {}
  scored.forEach(t => {
    const wine = wineById.get(t.wine_id)
    if (!wine) return
    const tipo = classifyWine(wine)
    const entry = tipoScores[tipo] ?? { sum: 0, count: 0 }
    entry.sum += t.puntuacion ?? 0
    entry.count += 1
    tipoScores[tipo] = entry
  })
  const tipoPreferido = Object.entries(tipoScores)
    .filter(([, v]) => v.count >= MIN_CATAS_TIPO)
    .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0]?.[0] ?? null

  // ── Regiones preferidas (top 3 por puntuación media, mín. MIN_CATAS_TIPO catas) ───────
  const regionScores: Record<string, { sum: number; count: number }> = {}
  scored.forEach(t => {
    const wine = wineById.get(t.wine_id)
    const region = wine?.region?.trim()
    if (!region) return
    const entry = regionScores[region] ?? { sum: 0, count: 0 }
    entry.sum += t.puntuacion ?? 0
    entry.count += 1
    regionScores[region] = entry
  })
  const regionesPreferidas = Object.entries(regionScores)
    .filter(([, v]) => v.count >= MIN_CATAS_TIPO)
    .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))
    .slice(0, 3)
    .map(([region]) => region)

  // ── Puntuación media general ──────────────────────────────────────────
  const puntuacionMediaGeneral = Math.round(
    (scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length) * 10
  ) / 10

  // ── Ocasiones frecuentes (top 3) ────────────────────────────────────────
  const ocasionCounts: Record<string, number> = {}
  tastings.forEach(t => {
    const ocasion = t.ocasion?.trim()
    if (!ocasion) return
    ocasionCounts[ocasion] = (ocasionCounts[ocasion] ?? 0) + 1
  })
  const ocasionesFrecuentes = Object.entries(ocasionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ocasion]) => ocasion)

  return {
    vinosMejorValorados,
    tipoPreferido,
    regionesPreferidas,
    puntuacionMediaGeneral,
    ocasionesFrecuentes,
  }
}
