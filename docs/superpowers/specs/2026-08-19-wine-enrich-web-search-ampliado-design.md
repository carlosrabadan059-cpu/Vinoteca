# Ampliar el enrich de vinos con más campos vía búsqueda web

## Contexto

El workflow n8n **"Vinoteca – Wine Enrich"** (`rV1BrlPmkUB87jnn`, V1.4) ya busca en Brave Search y usa esos resultados como grounding para OpenAI, con instrucciones estrictas de "nunca inventes, devuelve `null` si no hay certeza". Corre automáticamente tras cada escaneo (`Scan.tsx`), sin condición sobre si la etiqueta trasera existe o no.

Hoy solo rellena 5 campos que se aplican realmente en la app — `uva`, `crianza`, `alcohol`, `temp_servicio`, `url_bodega` — más un sexto, `precio`, que el workflow calcula (con una búsqueda de Brave dedicada) pero que el frontend nunca lee ni aplica: trabajo descartado en cada ejecución.

La ficha del vino (`WineDetail.tsx`, bloque "Características técnicas") muestra 7 campos — los 5 de arriba más `Región` y `D.O. / I.G.P.` — y además `Descripción` en el bloque "Información". Ninguno de estos dos últimos ni la descripción se enriquecen hoy.

Validado manualmente en esta sesión con una botella real (**La Chanin**, Cható Gañán — vino naranja de Albillo Real, Cebreros/Gredos, sin etiqueta trasera): buscando "La Chanin Cható Gañán" y descargando la página del producto de la bodega, se encontró viñedo, proceso de elaboración e historia de la bodega — información real, verificable y ausente de la etiqueta, que el enrich actual no captura porque (a) no busca esos campos y (b) solo usa los snippets cortos de Brave Search, no el contenido completo de la página.

## Objetivo

Ampliar el enrich existente — no crear un pipeline nuevo — para que cubra `region`, `denominacion` y `descripcion`, y para que el `precio` ya calculado se aplique de verdad. Mantener intacta la garantía ya vigente de que el modelo nunca inventa datos: todo lo nuevo debe resolver en `null`/campo ausente cuando no hay confirmación real, igual que ya hace el resto del workflow.

## Fuera de alcance

- `tipo` — se deja fuera; hoy viene de OCR/identify y no se ha demostrado que falte en la práctica.
- Cualquier disparo condicional nuevo (p. ej. "solo si falta trasera") — el enrich ya corre siempre; los campos nuevos se añaden a esa misma llamada.
- Corregir la inconsistencia preexistente de que el código n8n usa el literal `'brave_search'` como `source` en varios sitios cuando el enum TypeScript `SourceType` no lo incluye — se detectó durante el diseño pero no bloquea este trabajo (los campos nuevos usan `'official_winery'`, que sí existe en el enum) y no se toca aquí.

## Diseño

### 1. Workflow n8n — nodos nuevos entre `Preparar Grounding` y `OpenAI Enrich`

- **"Descargar Página Candidata"** (HTTP Request): GET a `candidate_url_bodega` (ya calculado hoy por `Preparar Grounding`, hoy solo usado para `url_bodega`). `neverError: true`, timeout 8s — mismo patrón que el nodo `Brave Search` existente. Si no hay `candidate_url_bodega` o la petición falla, el nodo simplemente no aporta contenido; no bloquea el resto del enrich.
- **"Extraer Texto de Página"** (Code): quita `<script>`/`<style>`, quita etiquetas HTML, colapsa espacios en blanco, trunca a ~4000 caracteres. Devuelve `page_text: string | null`.

### 2. `OpenAI Enrich` — prompt y JSON de salida ampliados

El JSON de salida gana tres campos: `region`, `denominacion`, `descripcion` (todos `string | null`).

El texto de grounding pasado al modelo pasa a tener dos secciones claramente separadas:
```
Resultados de búsqueda web reales:
<snippets de Brave, como hoy>

Contenido de la página oficial de la bodega (si disponible):
<page_text, o "No disponible" si el fetch falló o no hubo candidato>
```

Reglas nuevas en el system prompt (además de las ya existentes de "nunca inventes, null si no hay certeza"):
- `region`/`denominacion`: mismo criterio estricto que `uva`/`crianza`/`alcohol` — solo si aparece confirmado en el grounding.
- `descripcion`: párrafo de 2–4 frases, construido **exclusivamente** con hechos presentes en el "Contenido de la página oficial" (viñedo, proceso de elaboración, historia de la bodega). Si esa sección no está disponible o no aporta contenido sustancial, `descripcion: null` — nunca generar un párrafo genérico de relleno.

### 3. `Validar Respuesta` — nuevos `FieldTrace`

- `enriched.region` / `enriched.denominacion`: igual que los campos existentes (`source: 'other'`, mismo patrón de confidence).
- `enriched.descripcion`: `source: 'official_winery'` (ya existe en el enum `SourceType`, es la más precisa de las disponibles para este caso) y `source_url` = la URL descargada en el paso 1. Esto es lo único que alimenta la nota de atribución en la ficha.

### 4. Segunda pasada extractiva (`OpenAI Extraer de Búsqueda` + `Fusionar Campos`)

Se amplía para intentar también `region`/`denominacion` si la primera pasada los deja `null` — mismo patrón estricto ya usado para `uva`/`crianza`/`alcohol`/`temp_servicio`. `descripcion` **no** entra en esta segunda pasada — es síntesis, no extracción puntual de un valor corto; si la primera pasada no la produce, queda en `null` sin reintento forzado.

**Importante:** la condición `¿Faltan Campos?` que decide si esta segunda pasada se dispara hoy solo evalúa `!uva || !crianza || !alcohol || !temp_servicio`. Debe ampliarse a `!uva || !crianza || !alcohol || !temp_servicio || !region || !denominacion` — si no, la segunda pasada nunca se dispararía en un caso donde esos 4 campos ya vinieran resueltos pero `region`/`denominacion` no.

### 5. Tipos TypeScript (`src/types/index.ts`)

`EnrichResponse.enriched` gana:
```ts
region?:      FieldTrace
denominacion?: FieldTrace
descripcion?: FieldTrace
```

### 6. Frontend — `Scan.tsx`

En el merge tras escanear (mismo bloque donde hoy se aplican `uva`/`crianza`/`alcohol`/`temp_servicio`/`url_bodega`), se añaden con la misma regla — **solo rellena si está vacío, nunca pisa lo ya identificado**:
```ts
region:       (enriched.region?.value       as string | undefined) ?? identity.region       ?? undefined,
denominacion: (enriched.denominacion?.value as string | undefined) ?? identity.denominacion ?? undefined,
descripcion:  (enriched.descripcion?.value  as string | undefined) ?? scanResult.descripcion ?? undefined,
precio:       (enriched.precio?.value       as number | undefined) ?? undefined,
```
Nota: `region`/`denominacion` hoy vienen de `identity` (la normalización de `wine-identify`), no de `scanResult` — el enrich los rellena solo si `identity` los dejó en `null`. `descripcion` sigue el mismo patrón que ya usan uva/crianza: prioriza lo enriquecido sobre el OCR crudo del campo (que hoy casi siempre está vacío para este campo).

`descripcion_fuente_url` (ver migración abajo) se añade también al merge: `(enriched.descripcion?.source_url as string | undefined) ?? undefined`.

Todo esto llega al formulario de revisión (`setFormData`) antes de guardar — el usuario ve y puede editar cualquier campo, igual que ya ocurre hoy con los enriquecidos existentes. No hay guardado silencioso de datos de búsqueda.

### 7. Migración Supabase — nueva columna

```sql
alter table wines add column descripcion_fuente_url text;
```
Nullable, sin default. Necesaria porque `descripcion` es hoy solo texto plano — sin esta columna, la nota de atribución se perdería al recargar la ficha (solo existiría en el estado efímero de la sesión de escaneo).

### 8. Frontend — `WineDetail.tsx`

Bajo el párrafo de `descripcion` (línea ~611-613 actual), si `wine.descripcion_fuente_url` existe: una línea pequeña, estilo caption/muted, "Fuente: `<dominio limpio>`" enlazando a la URL completa — mismo patrón de limpieza de dominio (`replace(/^https?:\/\//, '')`) que ya usa `urlDisplay` para `url_bodega` en el mismo fichero.

## Error handling

Todo fallo nuevo (búsqueda sin resultados, página no descargable, timeout, campo no confirmado por el grounding) resuelve en `null`/campo ausente — nunca en un valor inventado, y nunca interrumpe el resto del enrich ni el guardado del vino. Mismo principio que ya rige el workflow existente para `url_bodega` (que ya se descarta si la URL no responde a una petición real).

## Testing

- Ejecutar el workflow (vía MCP `execute_workflow` o `test_workflow`) contra al menos dos casos reales: uno con etiqueta trasera completa (para confirmar que `region`/`denominacion` de `identity` no se pisan) y uno sin trasera tipo "vino de autor" (el caso de La Chanin, para confirmar que `descripcion` se rellena con contenido real y con `descripcion_fuente_url` coherente).
- Confirmar en un tercer caso que si la bodega no tiene web encontrable (o el fetch falla), `descripcion` queda `null` y el resto del enrich no se ve afectado.
- Verificar visualmente en `WineDetail.tsx` que la nota de atribución aparece solo cuando `descripcion_fuente_url` existe, y que el enlace resuelve a la URL correcta.
- `npx tsc -b` limpio tras los cambios de tipos y de `Scan.tsx`/`WineDetail.tsx`.
