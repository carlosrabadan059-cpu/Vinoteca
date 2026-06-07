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
  imagen_frontal_url: string | null
  imagen_trasera_url: string | null
  created_at: string
  synced_at: string | null
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
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SyncOperation {
  id: string
  table: 'wines' | 'tastings'
  action: 'insert' | 'update' | 'delete'
  data: unknown
  created_at: string
  retries: number
}
