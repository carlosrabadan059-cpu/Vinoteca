import type { Wine, Tasting } from '../types'

// ── Clasificación de tipo por nombre/uva ──────────────────────────────────────

const TINTOS    = ['tempranillo', 'garnacha', 'cabernet', 'merlot', 'syrah', 'malbec', 'monastrell', 'mencía', 'tinto', 'negro', 'cariñena', 'bobal', 'prieto']
const BLANCOS   = ['albariño', 'verdejo', 'chardonnay', 'sauvignon', 'riesling', 'viura', 'blanco', 'torrontés', 'godello', 'macabeo', 'moscatel', 'gewürz']
const ROSADOS   = ['rosado', 'rosé', 'clarete']
const ESPUMOSOS = ['cava', 'champagne', 'champán', 'espumoso', 'prosseco', 'prosecco', 'frizzante', 'crémant']
const DULCES    = ['dulce', 'pedro ximénez', 'px', 'moscatel', 'sauternes', 'ice wine', 'vendimia tardía']

export function classifyWine(wine: Wine): string {
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

export function decadeOf(anada: number | null): string {
  if (anada === null) return 'Sin añada'
  return `${Math.floor(anada / 10) * 10}s`
}

const MES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export interface EvolucionRow {
  mes: string
  cantidad: number
  mediaScore: number | null
}

export function buildEvolucion(tastings: Tasting[]): EvolucionRow[] {
  const now  = new Date()
  const rows: EvolucionRow[] = []

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

// ── Puntuación media y mejor vino ──────────────────────────────────────────────

export function computePuntuacionMedia(tastings: Tasting[]): number | null {
  const scored = tastings.filter(t => t.puntuacion !== null)
  if (scored.length === 0) return null
  return Math.round(scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length * 10) / 10
}

export interface MejorVino {
  nombre: string
  puntuacion: number
}

export function computeMejorVino(wines: Wine[], tastings: Tasting[]): MejorVino | null {
  const scored = tastings.filter(t => t.puntuacion !== null)
  if (scored.length === 0) return null
  const best = scored.reduce((a, b) => (b.puntuacion ?? 0) > (a.puntuacion ?? 0) ? b : a)
  const wine = wines.find(w => w.id === best.wine_id)
  if (!wine) return null
  return { nombre: wine.nombre, puntuacion: best.puntuacion! }
}

// ── Distribución por tipo ────────────────────────────────────────────────────

export interface TipoEntry {
  tipo: string
  count: number
}

export function computeDistribucionTipos(wines: Wine[]): TipoEntry[] {
  const map: Record<string, number> = {}
  wines.forEach(w => {
    const tipo = classifyWine(w)
    map[tipo] = (map[tipo] ?? 0) + 1
  })
  return Object.entries(map)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count)
}

// ── Distribución por añadas/décadas ────────────────────────────────────────────

const DECADE_ORDER = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s', 'Sin añada']

export interface DecadaEntry {
  decada: string
  count: number
}

export function computeDistribucionAnadas(wines: Wine[]): DecadaEntry[] {
  const map: Record<string, number> = {}
  wines.forEach(w => {
    const d = decadeOf(w.anada)
    map[d] = (map[d] ?? 0) + 1
  })
  return DECADE_ORDER
    .filter(d => map[d])
    .map(decada => ({ decada, count: map[decada] }))
}

// ── Distribución genérica por campo de texto (región, uva, bodega) ────────────

export interface DistribucionEntry {
  label: string
  count: number
}

export function computeDistribucionPorCampo(
  wines: Wine[],
  campo: 'region' | 'uva' | 'bodega',
  sinDatoLabel: string,
  top = 5
): DistribucionEntry[] {
  const map: Record<string, number> = {}
  wines.forEach(w => {
    const valor = w[campo]?.trim() || sinDatoLabel
    map[valor] = (map[valor] ?? 0) + 1
  })
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top)
}

// ── Datos de colección personal (precio, num_botellas) ─────────────────────────

export function computeValorEstimado(wines: Wine[]): number {
  return wines.reduce((sum, w) => sum + (w.precio ?? 0) * w.num_botellas, 0)
}

export function computeTotalBotellas(wines: Wine[]): number {
  return wines.reduce((sum, w) => sum + w.num_botellas, 0)
}
