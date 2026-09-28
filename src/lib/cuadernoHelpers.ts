import { classifyWine } from './statsHelpers'
import type { Tasting, TastingFinal, Wine } from '../types'

// ── Bodega vs. vino de fuera ─────────────────────────────────────────────────

/**
 * true si el vino está en la bodega. Los registros guardados en IndexedDB antes
 * de V3 no traen `en_bodega`, así que `undefined` cuenta como bodega.
 */
export function isInCellar(wine: Pick<Wine, 'en_bodega'> | null | undefined): boolean {
  return wine?.en_bodega !== false
}

// ── Índice del cuaderno (pestañas por tipo, estilo Moleskine) ────────────────

export type JournalTipo = 'Todos' | 'Tinto' | 'Blanco' | 'Rosado' | 'Espumoso' | 'Dulce'

export const JOURNAL_TIPOS: JournalTipo[] = ['Todos', 'Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce']

export interface JournalFilters {
  tipo:   JournalTipo
  region: string | null
  uva:    string | null
  query:  string
}

export const EMPTY_JOURNAL_FILTERS: JournalFilters = { tipo: 'Todos', region: null, uva: null, query: '' }

/** Las uvas se guardan como texto libre ("Tempranillo, Garnacha"): se separan. */
export function splitUvas(uva: string | null): string[] {
  if (!uva) return []
  return uva.split(/[,/;]| y /).map(u => u.trim()).filter(Boolean)
}

export function applyJournalFilters(
  tastings: Tasting[],
  wineMap:  Record<string, Wine>,
  { tipo, region, uva, query }: JournalFilters,
): Tasting[] {
  const q = query.trim().toLowerCase()
  return tastings.filter(t => {
    const w = wineMap[t.wine_id]
    // Sin vino cargado todavía: solo se muestra si no hay filtros activos
    if (!w) return tipo === 'Todos' && !region && !uva && !q

    if (tipo !== 'Todos' && classifyWine(w) !== tipo) return false
    if (region && w.region !== region) return false
    if (uva && !splitUvas(w.uva).some(u => u.toLowerCase() === uva.toLowerCase())) return false
    if (q) {
      const haystack = [w.nombre, w.bodega, w.region, w.denominacion, w.uva, t.lugar, t.con_quien, t.notas_cata]
        .filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

/** Opciones de región y uva presentes en el cuaderno, ordenadas por frecuencia. */
export function journalFacets(tastings: Tasting[], wineMap: Record<string, Wine>) {
  const regiones = new Map<string, number>()
  const uvas     = new Map<string, number>()
  for (const t of tastings) {
    const w = wineMap[t.wine_id]
    if (!w) continue
    if (w.region) regiones.set(w.region, (regiones.get(w.region) ?? 0) + 1)
    for (const u of splitUvas(w.uva)) uvas.set(u, (uvas.get(u) ?? 0) + 1)
  }
  const byCount = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
  return { regiones: byCount(regiones), uvas: byCount(uvas) }
}

// ── Ficha guiada ─────────────────────────────────────────────────────────────

export const BOCA_ESCALAS = [
  { key: 'dulzor', label: 'Dulzor',  min: 'Seco',     max: 'Dulce' },
  { key: 'acidez', label: 'Acidez',  min: 'Baja',     max: 'Alta' },
  { key: 'tanino', label: 'Tanino',  min: 'Suave',    max: 'Astringente' },
  { key: 'cuerpo', label: 'Cuerpo',  min: 'Ligero',   max: 'Potente' },
] as const satisfies ReadonlyArray<{ key: keyof Tasting; label: string; min: string; max: string }>

/** Campos que rellena la ficha guiada del cuaderno (JournalSheetForm). */
export type JournalSheetData = Pick<Tasting,
  | 'fecha' | 'lugar' | 'con_quien' | 'ocasion'
  | 'color_descripcion' | 'aroma'
  | 'dulzor' | 'acidez' | 'tanino' | 'cuerpo' | 'final'
  | 'puntuacion' | 'maridaje' | 'notas_cata' | 'botella_terminada'
>

export function emptySheet(fecha: string): JournalSheetData {
  return {
    fecha, lugar: null, con_quien: null, ocasion: null,
    color_descripcion: null, aroma: null,
    dulzor: null, acidez: null, tanino: null, cuerpo: null, final: null,
    puntuacion: null, maridaje: null, notas_cata: null, botella_terminada: false,
  }
}

/**
 * Boca en palabras para el tutor de cata: con números ("4/5") el modelo los
 * copia tal cual en la versión del sumiller.
 */
export function describeBoca(d: Pick<JournalSheetData, 'dulzor' | 'acidez' | 'tanino' | 'cuerpo' | 'final'>): string {
  const partes: string[] = BOCA_ESCALAS
    .filter(s => d[s.key] !== null)
    .map(s => {
      const v = d[s.key] as number
      const nivel = v === 1 ? s.min.toLowerCase()
        : v === 2 ? `tirando a ${s.min.toLowerCase()}`
        : v === 3 ? 'medio'
        : v === 4 ? `tirando a ${s.max.toLowerCase()}`
        : s.max.toLowerCase()
      return `${s.label}: ${nivel}`
    })
  if (d.final) partes.push(`Final: ${d.final}`)
  return partes.join('. ')
}

export const FINAL_OPCIONES: { id: TastingFinal; label: string }[] = [
  { id: 'corto', label: 'Corto' },
  { id: 'medio', label: 'Medio' },
  { id: 'largo', label: 'Largo' },
]
