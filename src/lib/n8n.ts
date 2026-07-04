import type { ChatMessage, IdentifyResponse, EnrichResponse } from '../types'

const N8N_BASE = import.meta.env.VITE_N8N_BASE_URL as string

export type ScanIdentifyResponse =
  | { found: true;  match_type: 'wine_uid'; wine_id: string; wine: import('../types').Wine }
  | { found: false; match_type: null; nombre: string | null; bodega: string | null; anada: number | null }

export interface ScanResult {
  is_wine:      boolean
  nombre:       string | null
  bodega:       string | null
  anada:        number | null
  region:       string | null
  denominacion: string | null
  uva:          string | null
  tipo:         string | null
  alcohol:      string | null
  crianza:      string | null
  descripcion:  string | null
  url_bodega:   string | null
  temp_servicio: string | null
  contiene:     string | null
  volumen:      string | null
  imagen_url:        string | null
  imagen_trasera_url: string | null
}

export interface WineCollection {
  id: string
  nombre: string
  bodega: string | null
  anada: number | null
  region: string | null
  uva: string | null
  denominacion: string | null
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60_000)

  try {
    const res = await fetch(`${N8N_BASE}/webhook/${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`n8n ${path} → ${res.status}: ${text}`)
    }

    const text = await res.text()
    if (!text) throw new Error(`n8n ${path} → respuesta vacía (200 sin body)`)
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`n8n ${path} → JSON inválido: ${text.slice(0, 200)}`)
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout en n8n/${path} (30s)`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function callSommelierChat(
  messages: ChatMessage[],
  wineCollection: WineCollection[],
  userMessage: string
): Promise<string> {
  const data = await post<{ reply: string }>('vinoteca/sommelier/chat', {
    messages,
    wineCollection,
    userMessage,
  })
  return data.reply
}

export async function callMaridaje(
  plato: string,
  wineCollection: WineCollection[],
  ocasion?: string
): Promise<{ recomendacion: string; wineId?: string }> {
  return post<{ recomendacion: string; wineId?: string }>('vinoteca/sommelier/maridaje', {
    plato,
    wineCollection,
    ocasion,
  })
}

export async function callEnriquecimiento(
  denominacion: string,
  region?: string,
  uva?: string
): Promise<{ info: string; fuente?: string }> {
  return post<{ info: string; fuente?: string }>('vinoteca/sommelier/enriquecimiento', {
    denominacion,
    region,
    uva,
  })
}

export interface StatsPayload {
  totalVinos: number
  totalCatas: number
  puntuacionMedia: number
  topRegiones: { region: string; count: number }[]
  distribucionTipos: { tipo: string; count: number }[]
  anadas: { decada: string; count: number }[]
  mejorVino: { nombre: string; puntuacion: number } | null
}

function stripBase64Prefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[^;]+;base64,/, '')
}

export async function callScanIdentificar(
  frontImageDataUrl: string,
  userId: string
): Promise<ScanIdentifyResponse> {
  const front = stripBase64Prefix(frontImageDataUrl)
  return post<ScanIdentifyResponse>('vinoteca/scan/identificar', { front, user_id: userId })
}

export async function callScanAnalizar(
  frontImageDataUrl: string,
  backImageDataUrl?: string
): Promise<ScanResult> {
  const front = stripBase64Prefix(frontImageDataUrl)
  return post<ScanResult>('vinoteca/scan/analizar', {
    front,
    back: backImageDataUrl ? stripBase64Prefix(backImageDataUrl) : null,
  })
}

// ── V1.4: Identificación y enriquecimiento ───────────────────────────────────

export async function callWineIdentify(
  campos: {
    nombre:      string | null
    bodega:      string | null
    anada:       number | null
    region?:     string | null
    denominacion?: string | null
    uva?:        string | null
  },
  userId: string
): Promise<IdentifyResponse> {
  return post<IdentifyResponse>('vinoteca/wine/identify', { ...campos, user_id: userId })
}

export async function callWineEnrich(
  wineUid: string,
  identifiedAs?: {
    nombre:       string | null
    bodega:       string | null
    anada:        number | null
    region?:      string | null
    denominacion?: string | null
  }
): Promise<EnrichResponse> {
  return post<EnrichResponse>('vinoteca/wine/enrich', {
    wine_uid:      wineUid,
    identified_as: identifiedAs ?? null,
  })
}

export async function callStatsInsight(
  stats: StatsPayload
): Promise<{ insight: string }> {
  return post<{ insight: string }>('vinoteca/stats/insight', stats)
}
