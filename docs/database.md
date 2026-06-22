# Base de datos — Vinoteca

Vinoteca usa Supabase (PostgreSQL). Los tipos TypeScript en `src/types/index.ts` reflejan el esquema de las tablas.

## Tabla `wines`

Almacena la ficha de cada vino. Cada registro pertenece a un usuario.

| Columna | Tipo TS | Nullable | Descripción |
|---------|---------|----------|-------------|
| `id` | `string` | No | UUID, clave primaria |
| `user_id` | `string` | No | UUID del usuario propietario (FK → auth.users) |
| `nombre` | `string` | No | Nombre del vino |
| `bodega` | `string \| null` | Sí | Nombre de la bodega productora |
| `anada` | `number \| null` | Sí | Año de cosecha |
| `region` | `string \| null` | Sí | Región vitivinícola |
| `denominacion` | `string \| null` | Sí | Denominación de origen |
| `uva` | `string \| null` | Sí | Variedad o variedades de uva |
| `tipo` | `string \| null` | Sí | Tinto / Blanco / Rosado / Espumoso / Dulce |
| `alcohol` | `string \| null` | Sí | Graduación alcohólica (ej. "13,5%") |
| `crianza` | `string \| null` | Sí | Tipo de crianza (Joven, Roble, Crianza, Reserva…) |
| `descripcion` | `string \| null` | Sí | Descripción libre o generada por IA |
| `url_bodega` | `string \| null` | Sí | URL del sitio web de la bodega |
| `temp_servicio` | `string \| null` | Sí | Temperatura de servicio recomendada |
| `contiene` | `string \| null` | Sí | Alérgenos y aditivos (sulfitos, etc.) |
| `volumen` | `string \| null` | Sí | Volumen de la botella (ej. "75cl") |
| `imagen_frontal_url` | `string \| null` | Sí | URL firmada de la etiqueta frontal en Supabase Storage |
| `imagen_trasera_url` | `string \| null` | Sí | URL firmada de la etiqueta trasera en Supabase Storage |
| `qr_fuente` | `string \| null` | Sí | URL del QR leído en la etiqueta (si existe) |
| `wine_uid` | `string \| null` | Sí | Hash SHA-256 determinista del vino (ver abajo) |
| `created_at` | `string` | No | ISO 8601, timestamp de creación |
| `synced_at` | `string \| null` | Sí | ISO 8601, última sincronización con Supabase |

## Tabla `tastings`

Almacena cada sesión de cata vinculada a un vino.

| Columna | Tipo TS | Nullable | Descripción |
|---------|---------|----------|-------------|
| `id` | `string` | No | UUID, clave primaria |
| `user_id` | `string` | No | UUID del usuario |
| `wine_id` | `string` | No | UUID del vino catado (FK → wines.id) |
| `fecha` | `string` | No | Fecha de la cata (ISO 8601) |
| `puntuacion` | `number \| null` | Sí | Puntuación (escala libre, típicamente 0-100) |
| `notas_cata` | `string \| null` | Sí | Notas libres del catador |
| `aroma` | `string \| null` | Sí | Descripción de aromas |
| `color_descripcion` | `string \| null` | Sí | Descripción del color |
| `maridaje` | `string \| null` | Sí | Maridaje anotado |
| `chat_history` | `ChatMessage[]` | No | Historial del chat con el asistente de cata |
| `created_at` | `string` | No | ISO 8601, timestamp de creación |

## Tipo `ChatMessage`

Usado como elemento de `tastings.chat_history` y en el Sommelier.

```typescript
interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}
```

## Tipo `SyncOperation`

No tiene tabla en Supabase. Se almacena únicamente en la cola IDB local hasta ser procesado.

```typescript
interface SyncOperation {
  id:         string
  table:      'wines' | 'tastings'
  action:     'insert' | 'update' | 'delete'
  data:       unknown
  created_at: string
  retries:    number
}
```

## Campo `wine_uid`: algoritmo de generación

`wine_uid` es un identificador determinista que permite detectar duplicados y hacer lookups rápidos sin búsquedas de texto inexactas.

### Función `normalizeWineText`

```typescript
function normalizeWineText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .normalize('NFD')                        // descompone caracteres acentuados
    .replace(/[̀-ͯ]/g, '')         // elimina diacríticos (ñ→n, á→a…)
    .replace(/[.,\-_/]/g, ' ')              // puntuación → espacio
    .replace(/\s+/g, ' ')                   // colapsa espacios múltiples
    .trim()
}
```

### Función `generateWineUid`

```typescript
async function generateWineUid(input: {
  nombre: string | null
  bodega: string | null
  anada:  number | null
}): Promise<string> {
  const raw = [
    normalizeWineText(input.nombre),
    normalizeWineText(input.bodega),
    input.anada !== null ? String(input.anada) : 'unknown-year',
  ].join('|')

  const encoded = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

**Formato de la cadena a hashear:**

```
normalizeWineText(nombre)|normalizeWineText(bodega)|anada_o_unknown-year
```

**Vector de prueba canónico:**

| Campo | Valor |
|-------|-------|
| nombre | `"Habla La Tierra"` |
| bodega | `"Bodegas Habla"` |
| añada | `2024` |
| Cadena raw | `"habla la tierra\|bodegas habla\|2024"` |
| SHA-256 | `8d0d78b51214f00ae5a3861a7acf3550638338f26bbe9aa01359436bb8993a5e` |

### Lookup por `wine_uid`

`findDuplicateWine()` en `src/lib/wineDuplicates.ts`:

1. **Ruta rápida:** genera el `wine_uid` del candidato y busca `WHERE wine_uid = $uid AND user_id = $userId`.
2. **Fallback:** para vinos sin `wine_uid` (registros anteriores), recupera todos los vinos con `wine_uid IS NULL` y compara con `normalizeWineText` en memoria.

Devuelve `DuplicateResult`:
```typescript
interface DuplicateResult {
  exactDuplicate: Wine | null    // misma bodega + nombre + añada
  similarWines:   Wine[]         // misma bodega + nombre, añada diferente
}
```

### Backfill de `wine_uid`

Los vinos creados antes de implementar este campo tienen `wine_uid = NULL`. Para rellenarlos, ejecutar desde la consola del navegador (código comentado al final de `src/lib/wineDuplicates.ts`):

```javascript
const wines = await supabase.from('wines').select('id,nombre,bodega,anada').is('wine_uid', null)
for (const w of wines.data) {
  const uid = await generateWineUid(w)
  await supabase.from('wines').update({ wine_uid: uid }).eq('id', w.id)
}
```

## Patrones de consulta en el código

- Todas las consultas filtran por `user_id` del usuario autenticado.
- `listWines()` usa paginación: `range(from, to)` con `PAGE_SIZE = 20`.
- Búsqueda de texto: `OR nombre.ilike.%q%, bodega.ilike.%q%, region.ilike.%q%`.
- Ordenación por defecto: `created_at DESC`.
