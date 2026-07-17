export interface Wine {
  id: string
  user_id: string
  nombre: string
  bodega: string | null
  anada: number | null
  region: string | null
  denominacion: string | null
  uva: string | null
  tipo: string | null
  alcohol: string | null
  crianza: string | null
  descripcion: string | null
  url_bodega: string | null
  temp_servicio: string | null
  contiene: string | null
  volumen: string | null
  imagen_frontal_url: string | null
  imagen_trasera_url: string | null
  qr_fuente: string | null
  wine_uid: string | null
  created_at: string
  synced_at: string | null
  // Colección personal
  precio:       number | null
  num_botellas: number
  ubicacion:    string | null
  fecha_compra: string | null
  favorito:     boolean
  consumido:    boolean
}

export interface Tasting {
  id: string
  user_id: string
  wine_id: string
  fecha: string
  puntuacion: number | null
  notas_cata: string | null
  aroma: string | null
  color_descripcion: string | null
  maridaje: string | null
  chat_history: ChatMessage[]
  created_at: string
  // V1.2
  es_consumo_rapido: boolean
  botella_terminada: boolean
  ocasion:           string | null
  lugar:             string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ── Fase 9: identidad y preferencias ─────────────────────────────────────────

export type UserRole = 'user' | 'premium' | 'family' | 'admin'
export type UserPlan = 'free' | 'premium' | 'family'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  country: string | null
  locale: string
  role: UserRole
  plan: UserPlan
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  theme: 'system' | 'light' | 'dark'
  language: string
  currency: string
  timezone: string
  date_format: string
  notifications_email: boolean
  notifications_push: boolean
  camera_preferences: Record<string, unknown>
  ai_preferences: Record<string, unknown>
  privacy_preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ── V1.4: Identificación y enriquecimiento ───────────────────────────────────

export type SourceType =
  | 'official_winery'
  | 'technical_sheet'
  | 'do_oficial'
  | 'distributor'
  | 'vivino'
  | 'other'

export interface FieldTrace {
  value:           string | string[] | null
  source:          SourceType
  source_url:      string
  source_priority: 1 | 2 | 3 | 4 | 5 | 6
  obtained_at:     string                   // ISO 8601
  confidence:      'high' | 'medium' | 'low'
  conflict?:       boolean
  alternatives?:   Array<{
    value:           string
    source:          SourceType
    source_priority: number
  }>
}

export interface IdentifyResponse {
  wine_uid:          string | null
  wine_id:           string | null          // id de Supabase cuando exists=true
  identified_as:     string | null          // "Malleolus 2021 — Bodegas Emilio Moro"
  confidence:        number                 // 0–1
  confidence_reason: string | null
  exists:            boolean                // ya está en la bodega del usuario
  normalizado: {
    nombre:      string | null
    bodega:      string | null
    anada:       number | null
    region:      string | null
    denominacion: string | null
  }
}

export interface EnrichResponse {
  wine_uid:         string
  identified_as:    string | null
  enrich_confidence: number                 // 0–1
  sources: Array<{
    type:     SourceType
    url:      string
    priority: number
  }>
  enriched: {
    uva?:          FieldTrace
    crianza?:      FieldTrace
    alcohol?:      FieldTrace
    temp_servicio?: FieldTrace
    url_bodega?:   FieldTrace
    imagen_url?:   FieldTrace
  }
}

export interface SyncOperation {
  id: string
  table: 'wines' | 'tastings'
  action: 'insert' | 'update' | 'delete'
  data: unknown
  created_at: string
  retries: number
}
