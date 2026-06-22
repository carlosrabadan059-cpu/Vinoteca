# Flujo de escaneo — Vinoteca

El escaneo de etiquetas es la funcionalidad central de adición de vinos. Sigue un proceso en dos fases para minimizar tiempo y coste: primero intenta identificar un vino ya existente en la bodega del usuario; solo si no lo encuentra realiza el análisis completo de la etiqueta.

## Visión general

```
Usuario captura foto frontal (y opcionalmente trasera)
        │
        ▼
  Fase 1: IDENTIFICAR
  POST /webhook/vinoteca/scan/identificar
        │
        ├─► found: true
        │     └─► navigate('/bodega/:wine_id')  ← vino ya existe, va al detalle
        │
        └─► found: false
              │
              ▼
        Fase 2: ANALIZAR
        POST /webhook/vinoteca/scan/analizar
              │
              ▼
        WineForm prellenado con los datos extraídos
              │
              ▼
        Usuario revisa y guarda
              │
              ▼
        createWine() → IDB + Supabase + Storage
```

## Fase 1 — Identificar (`callScanIdentificar`)

### Llamada desde el cliente

```typescript
callScanIdentificar(frontImageDataUrl: string, userId: string): Promise<ScanIdentifyResponse>
```

**Preprocesado:** antes de enviar, `stripBase64Prefix()` elimina el prefijo `data:image/...;base64,` del data URL:

```typescript
function stripBase64Prefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[^;]+;base64,/, '')
}
```

**Payload enviado a n8n:**
```json
{ "front": "<base64 sin prefijo>", "user_id": "<uuid>" }
```

### Respuesta discriminada (`ScanIdentifyResponse`)

```typescript
type ScanIdentifyResponse =
  | { found: true;  match_type: 'qr' | 'wine_uid'; wine_id: string; wine: Wine }
  | { found: false; match_type: null; nombre: string | null; bodega: string | null; anada: number | null }
```

**`match_type: 'qr'`** — el workflow encontró un código QR en la etiqueta con URL de la bodega y localizó el vino por ese campo.

**`match_type: 'wine_uid'`** — el workflow generó el `wine_uid` del vino extraído y encontró coincidencia en la tabla `wines` del usuario.

### Lógica n8n del workflow (inferida del comportamiento)

1. Webhook recibe `{ front, user_id }`
2. OCR con OpenAI Vision extrae texto de la etiqueta
3. Parse OCR: identifica nombre, bodega, añada
4. Genera `wine_uid` con el mismo algoritmo SHA-256 que el cliente
5. Busca en `wines` WHERE `user_id = $user_id` AND (`wine_uid = $uid` OR `qr_fuente = $url`)
6. Construye la respuesta discriminada

## Algoritmo `wine_uid`

El identificador determinista se calcula igual en el cliente y en n8n para garantizar la coherencia del lookup.

### `normalizeWineText`

```
entrada: string | null | undefined
salida:  string (vacío si null/undefined)

1. toLowerCase()
2. normalize('NFD')          → descompone "ñ" en "n" + diacrítico
3. replace /[̀-ͯ]/g → ''   → elimina diacríticos
4. replace /[.,\-_/]/g → ' ' → puntuación a espacio
5. replace /\s+/g → ' '     → colapsa espacios
6. trim()
```

### Cadena a hashear

```
normalizeWineText(nombre) + "|" + normalizeWineText(bodega) + "|" + (anada ?? "unknown-year")
```

### Hash

SHA-256 sobre `TextEncoder().encode(cadena)` → hex string de 64 caracteres.

### Vector de prueba canónico

```
nombre: "Habla La Tierra"
bodega: "Bodegas Habla"
anada:  2024

cadena: "habla la tierra|bodegas habla|2024"
hash:   8d0d78b51214f00ae5a3861a7acf3550638338f26bbe9aa01359436bb8993a5e
```

## Fase 2 — Analizar (`callScanAnalizar`)

Solo se ejecuta cuando la Fase 1 devuelve `found: false`.

### Llamada desde el cliente

```typescript
callScanAnalizar(frontImageDataUrl: string, backImageDataUrl?: string): Promise<ScanResult>
```

**Payload:**
```json
{ "front": "<base64>", "back": "<base64 o null>" }
```

### Respuesta (`ScanResult`)

```typescript
interface ScanResult {
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

El workflow de n8n realiza un análisis exhaustivo con GPT-4o Vision sobre ambas etiquetas y devuelve todos los campos posibles del vino.

## Máquina de estados en `Scan.tsx`

### Pasos del flujo de captura

```typescript
type Step = 'frontal' | 'trasera' | 'review' | 'done'
```

| Paso | Descripción |
|------|-------------|
| `frontal` | Pantalla inicial — captura de la etiqueta delantera |
| `trasera` | Captura opcional de la etiqueta trasera |
| `review` | Formulario `WineForm` prellenado, usuario revisa y edita |
| `done` | Guardado completado |

El progreso visual se muestra con `STEPS = ['Foto frontal', 'Foto trasera', 'Revisar', 'Guardar']`.

### Componente `AnalysisProgress`

Overlay a pantalla completa que aparece durante las fases de análisis:

```typescript
// phase prop
'identifying'  → "Identificando vino…"  (Fase 1)
'analyzing'    → "Analizando etiqueta…" (Fase 2)
```

**Comportamiento de la barra de progreso:**
- 0% → 70% en 10 segundos (velocidad constante simulada)
- 70% → 95% de forma lenta (refleja que n8n puede tardar)
- 100% al completar, con estado de éxito (verde) y cierre automático a 600ms
- Estado de error: muestra mensaje y botón "Reintentar"

**Animaciones:** entrada (fade in + translateY de +20px a 0) y salida (fade out + translateY de 0 a -20px) de 300ms.

## Detección de duplicados tras el análisis

Antes de mostrar el formulario de revisión, `Scan.tsx` llama a `findDuplicateWine()`:

```typescript
findDuplicateWine(wine: { nombre, bodega, anada }, userId)
  → DuplicateResult { exactDuplicate: Wine | null, similarWines: Wine[] }
```

Si `exactDuplicate !== null`, se muestra `DuplicateWineDialog` para que el usuario confirme si quiere añadir de todas formas o ir al vino existente.

## Guardado final

El formulario `WineForm` en modo review llama a `createWine(data, images, { skipDuplicateCheck: true })` desde `useWines`, que:

1. Guarda en IDB (`saveWineLocally`)
2. Sube imágenes a Supabase Storage (`uploadWineImage`)
3. Inserta en `wines` vía Supabase
4. Si falla → encola en `sync_queue`

## Requisitos de credenciales en n8n

| Requisito | Detalle |
|-----------|---------|
| Header Auth (webhooks) | ID `mSeQOoORfe8qLqNH`, Name=`Authorization`, Value=`Bearer sk-...` |
| Supabase en n8n | Variable de entorno `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (Portainer) |

La service key es necesaria porque n8n necesita leer la tabla `wines` de cualquier usuario para el lookup por `wine_uid`, lo que requiere saltarse las políticas RLS del cliente.
