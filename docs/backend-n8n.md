# Backend n8n — Vinoteca

## Configuración

n8n está desplegado de forma autónoma en `n8n.rabadanhouse.space` (Portainer/Docker).

La URL base se configura vía variable de entorno:

```
VITE_N8N_BASE_URL=https://n8n.rabadanhouse.space
```

## Cliente HTTP (`src/lib/n8n.ts`)

Todas las llamadas pasan por la función interna `post<T>()`:

```typescript
async function post<T>(path: string, body: unknown): Promise<T>
```

- **Timeout:** 60 segundos (AbortController)
- **Método:** POST
- **Content-Type:** `application/json`
- **URL construida:** `${N8N_BASE}/webhook/${path}`
- **Errores:** Lanza `Error` con el status HTTP y el body de texto si `!res.ok`. Lanza `Error` con mensaje `"Timeout en n8n/${path} (30s)"` si la petición es abortada.

## Endpoints

### 1. Sommelier — Chat libre

**Ruta:** `POST /webhook/vinoteca/sommelier/chat`  
**Función cliente:** `callSommelierChat(messages, wineCollection, userMessage)`

**Request:**
```typescript
{
  messages:       ChatMessage[]      // historial de conversación
  wineCollection: WineCollection[]   // hasta 50 vinos del usuario
  userMessage:    string             // último mensaje del usuario
}
```

**Response:**
```typescript
{ reply: string }
```

**Uso:** Preguntas generales sobre vinos, consultas sobre la bodega personal del usuario.

---

### 2. Sommelier — Maridaje

**Ruta:** `POST /webhook/vinoteca/sommelier/maridaje`  
**Función cliente:** `callMaridaje(plato, wineCollection, ocasion?)`

**Request:**
```typescript
{
  plato:          string             // plato o ingrediente principal
  wineCollection: WineCollection[]   // bodega del usuario
  ocasion?:       string             // contexto opcional (ej. "cena romántica")
}
```

**Response:**
```typescript
{ recomendacion: string; wineId?: string }
```

`wineId` está presente cuando n8n identifica un vino concreto de la colección como recomendación.

**Activación:** `detectIntent()` en `Sommelier.tsx` activa este endpoint cuando el mensaje contiene palabras clave de maridaje ("maridar", "con carne", "esta noche", etc.).

---

### 3. Sommelier — Enriquecimiento

**Ruta:** `POST /webhook/vinoteca/sommelier/enriquecimiento`  
**Función cliente:** `callEnriquecimiento(denominacion, region?, uva?)`

**Request:**
```typescript
{
  denominacion: string
  region?:      string
  uva?:         string
}
```

**Response:**
```typescript
{ info: string; fuente?: string }
```

**Activación:** `detectIntent()` activa este endpoint cuando el mensaje menciona denominaciones de origen (Rioja, Priorat, Rías Baixas, etc.).

---

### 4. Scan — Identificar

**Ruta:** `POST /webhook/vinoteca/scan/identificar`  
**Función cliente:** `callScanIdentificar(frontImageDataUrl, userId)`

**Request:**
```typescript
{
  front:   string   // imagen frontal en base64 (sin prefijo data:image/...)
  user_id: string
}
```

**Response** (discriminated union):
```typescript
// Vino encontrado:
{ found: true; match_type: 'qr' | 'wine_uid'; wine_id: string; wine: Wine }

// Vino no encontrado:
{ found: false; match_type: null; nombre: string | null; bodega: string | null; anada: number | null }
```

**Descripción:** Primera fase del escaneo. n8n extrae texto de la etiqueta, genera el `wine_uid` con el mismo algoritmo que el cliente, y busca en la tabla `wines` del usuario. Si hay coincidencia, devuelve el vino completo. Si no, devuelve los datos extraídos para continuar al análisis completo.

---

### 5. Scan — Analizar

**Ruta:** `POST /webhook/vinoteca/scan/analizar`  
**Función cliente:** `callScanAnalizar(frontImageDataUrl, backImageDataUrl?)`

**Request:**
```typescript
{
  front: string         // base64 imagen frontal (sin prefijo)
  back:  string | null  // base64 imagen trasera (sin prefijo), opcional
}
```

**Response** (`ScanResult`):
```typescript
{
  nombre:             string | null
  bodega:             string | null
  anada:              number | null
  region:             string | null
  denominacion:       string | null
  uva:                string | null
  tipo:               string | null
  alcohol:            string | null
  crianza:            string | null
  descripcion:        string | null
  url_bodega:         string | null
  temp_servicio:      string | null
  contiene:           string | null
  volumen:            string | null
  imagen_url:         string | null
  imagen_trasera_url: string | null
}
```

**Descripción:** Segunda fase del escaneo. Solo se llama si la fase de identificación devuelve `found: false`. Realiza un análisis exhaustivo de ambas etiquetas con GPT-4o Vision.

---

### 6. Stats — Insight

**Ruta:** `POST /webhook/vinoteca/stats/insight`  
**Función cliente:** `callStatsInsight(stats)`

**Request** (`StatsPayload`):
```typescript
{
  totalVinos:        number
  totalCatas:        number
  puntuacionMedia:   number
  topRegiones:       { region: string; count: number }[]
  distribucionTipos: { tipo: string; count: number }[]
  anadas:            { decada: string; count: number }[]
  mejorVino:         { nombre: string; puntuacion: number } | null
}
```

**Response:**
```typescript
{ insight: string }
```

**Descripción:** Genera un comentario narrativo sobre las estadísticas de la bodega del usuario.

---

## Tipo `WineCollection`

Subconjunto de `Wine` enviado al Sommelier para contextualizar las respuestas:

```typescript
interface WineCollection {
  id:           string
  nombre:       string
  bodega:       string | null
  anada:        number | null
  region:       string | null
  uva:          string | null
  denominacion: string | null
}
```

Se trunca a los primeros 50 vinos de la bodega (`wines.slice(0, 50)`).

## Credenciales requeridas (setup manual en n8n)

### Header Auth para proteger los webhooks

- **Tipo:** Header Auth account
- **ID en n8n:** `mSeQOoORfe8qLqNH`
- **Name:** `Authorization`
- **Value:** `Bearer sk-...` (clave propia)

### Variables de entorno en Portainer

```
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
```

La service key permite a n8n leer y escribir en Supabase sin restricciones RLS, necesario para los flujos de scan/identificar.
