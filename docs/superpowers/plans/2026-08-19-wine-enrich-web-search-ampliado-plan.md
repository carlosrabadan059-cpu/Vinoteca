# Ampliar wine-enrich con búsqueda web (region/denominacion/descripcion) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar el workflow n8n existente "Vinoteca – Wine Enrich" para que también rellene `region`, `denominacion` y `descripcion` (además de los 5 campos que ya rellena), descargando y usando el contenido completo de la página de la bodega candidata — no solo los snippets de Brave Search — y aplicar en el frontend el `precio` que el workflow ya calcula pero hoy descarta.

**Architecture:** Es una ampliación incremental de un workflow n8n ya activo (`rV1BrlPmkUB87jnn`), no uno nuevo — dos nodos nuevos (descarga + extracción de texto de la página candidata) se insertan entre `Preparar Grounding` y `OpenAI Enrich`, y cinco nodos existentes se editan (prompt/JSON de las dos llamadas a OpenAI, y los tres Code nodes de parseo/fusión/validación) para propagar los tres campos nuevos manteniendo la misma garantía ya vigente: si no hay confirmación real, el campo queda en `null`. En el repo de la app, los tipos TypeScript y el merge de `Scan.tsx` se amplían igual que ya está hecho hoy para `uva`/`crianza`/`alcohol`, y una migración Supabase añade la columna que sostiene la nota de atribución de `descripcion` en la ficha.

**Tech Stack:** n8n (Code nodes en JavaScript, `@n8n/n8n-nodes-langchain.openAi`, `n8n-nodes-base.httpRequest`), Supabase Postgres, React 19 + TypeScript (Vite).

Spec: [`docs/superpowers/specs/2026-08-19-wine-enrich-web-search-ampliado-design.md`](../specs/2026-08-19-wine-enrich-web-search-ampliado-design.md)

---

### Task 1: Tipos TypeScript

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Añadir `descripcion_fuente_url` a la interfaz `Wine`**

Localiza el bloque (cerca de la línea 15):
```ts
  descripcion: string | null
  url_bodega: string | null
```
Sustitúyelo por:
```ts
  descripcion: string | null
  descripcion_fuente_url: string | null
  url_bodega: string | null
```

- [ ] **Step 2: Añadir `region`/`denominacion`/`descripcion` a `EnrichResponse.enriched`**

Localiza el bloque (cerca de la línea 138):
```ts
  enriched: {
    uva?:          FieldTrace
    crianza?:      FieldTrace
    alcohol?:      FieldTrace
    temp_servicio?: FieldTrace
    url_bodega?:   FieldTrace
    imagen_url?:   FieldTrace
  }
```
Sustitúyelo por:
```ts
  enriched: {
    uva?:          FieldTrace
    crianza?:      FieldTrace
    alcohol?:      FieldTrace
    temp_servicio?: FieldTrace
    url_bodega?:   FieldTrace
    imagen_url?:   FieldTrace
    region?:       FieldTrace
    denominacion?: FieldTrace
    descripcion?:  FieldTrace
  }
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc -b`
Expected: sin salida (build limpio). **No uses `npx tsc --noEmit`** — en este repo es un no-op silencioso (el `tsconfig.json` raíz es solution-style, `"files": []`), siempre da exit 0 sin comprobar nada de verdad.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): añadir region/denominacion/descripcion a EnrichResponse y descripcion_fuente_url a Wine"
```

---

### Task 2: Migración Supabase — columna `descripcion_fuente_url`

**Files:** ninguno en el repo (migración aplicada directamente vía MCP contra el proyecto self-hosted — ver `docs/supabase.md` para el contexto de esa instancia).

- [ ] **Step 1: Aplicar la migración**

Usa la tool `mcp__supabase__apply_migration` con:
- `name`: `add_descripcion_fuente_url_to_wines`
- `query`:
```sql
alter table wines add column descripcion_fuente_url text;
```

- [ ] **Step 2: Verificar que la columna existe**

Usa `mcp__supabase__execute_sql` con:
```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'wines' and column_name = 'descripcion_fuente_url';
```
Expected: una fila — `descripcion_fuente_url | text | YES`.

No hace falta commit en este repo — la migración vive en la base de datos, no en el árbol de git de Vinoteca (este proyecto no gestiona migraciones Supabase como ficheros versionados; confirmar contra `mcp__supabase__list_migrations` si se quiere doble comprobación, pero no es obligatorio para este task).

---

### Task 3: Workflow n8n — ampliar "Vinoteca – Wine Enrich"

**Files:** ninguno en el repo — todo el cambio vive en el workflow n8n `rV1BrlPmkUB87jnn` ("Vinoteca – Wine Enrich"), editado vía MCP.

Este task aplica **todos** los cambios del workflow en una sola llamada atómica a `mcp__n8n-mcp__update_workflow` (13 operaciones) — si cualquier operación fallara, no se guarda nada, así que el workflow nunca queda en un estado a medias (nodos nuevos sin las validaciones actualizadas, etc.).

- [ ] **Step 1: Aplicar las 13 operaciones**

Llama a `mcp__n8n-mcp__update_workflow` con `workflowId: "rV1BrlPmkUB87jnn"`, `versionName: "Ampliar enrich: region/denominacion/descripcion + página completa"`, y `operations` exactamente así (en este orden):

```json
[
  {
    "type": "removeConnection",
    "source": "Preparar Grounding",
    "target": "OpenAI Enrich"
  },
  {
    "type": "addNode",
    "node": {
      "name": "Descargar Página Candidata",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.5,
      "position": [500, 160],
      "parameters": {
        "method": "GET",
        "url": "={{ $json.candidate_url_bodega }}",
        "authentication": "none",
        "sendHeaders": true,
        "specifyHeaders": "keypair",
        "headerParameters": {
          "parameters": [
            { "name": "User-Agent", "value": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" }
          ]
        },
        "options": {
          "response": {
            "response": {
              "responseFormat": "text",
              "neverError": true
            }
          },
          "timeout": 8000
        }
      }
    }
  },
  {
    "type": "addNode",
    "node": {
      "name": "Extraer Texto de Página",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [750, 160],
      "parameters": {
        "mode": "runOnceForAllItems",
        "language": "javaScript",
        "jsCode": "// F6f — Extraer Texto de Página: combina snippets de Brave Search + el contenido de\n// la página oficial de la bodega (si se pudo descargar) en un único grounding_text_completo\n// para OpenAI. Si la descarga falló o no había candidate_url_bodega, sigue solo con snippets.\nconst grounding = $('Preparar Grounding').first().json\nconst respuesta = $input.first().json\n\nconst html = typeof respuesta.data === 'string' ? respuesta.data : null\n\nlet pageText = null\nif (html) {\n  let texto = html\n    .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')\n    .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')\n    .replace(/<!--[\\s\\S]*?-->/g, ' ')\n    .replace(/<[^>]+>/g, ' ')\n    .replace(/&nbsp;/g, ' ')\n    .replace(/&amp;/g, '&')\n    .replace(/\\s+/g, ' ')\n    .trim()\n  if (texto.length > 4000) texto = texto.slice(0, 4000)\n  pageText = texto.length > 0 ? texto : null\n}\n\nconst seccionPagina = pageText ?? 'No disponible.'\n\nconst groundingCompleto =\n  'Resultados de búsqueda web reales:\\n' + grounding.grounding_text +\n  '\\n\\nContenido de la página oficial de la bodega (si disponible):\\n' + seccionPagina\n\nreturn [{\n  json: {\n    grounding_text_completo: groundingCompleto,\n  }\n}]\n"
      }
    }
  },
  {
    "type": "addConnection",
    "source": "Preparar Grounding",
    "target": "Descargar Página Candidata"
  },
  {
    "type": "addConnection",
    "source": "Descargar Página Candidata",
    "target": "Extraer Texto de Página"
  },
  {
    "type": "addConnection",
    "source": "Extraer Texto de Página",
    "target": "OpenAI Enrich"
  },
  {
    "type": "setNodeSettings",
    "nodeName": "Descargar Página Candidata",
    "settings": { "onError": "continueRegularOutput" }
  },
  {
    "type": "setNodeParameter",
    "nodeName": "OpenAI Enrich",
    "path": "/parameters/responses/values/0/content",
    "value": "Eres un experto en vinos españoles e internacionales. Dado un vino, devuelves SOLO un JSON con información objetiva y verificable. Nunca inventas datos. Si no conoces un campo con certeza absoluta, devuelve null para ese campo.\n\nSi se te proporcionan resultados de búsqueda web reales como referencia, dales prioridad: úsalos para confirmar o corregir uva, crianza, alcohol, temp_servicio, region, denominacion y url_bodega. Si los resultados no confirman un dato y no lo sabes con certeza, devuelve null — no rellenes con suposiciones.\n\nPara descripcion: escribe un párrafo de 2 a 4 frases usando EXCLUSIVAMENTE hechos presentes en la sección \"Contenido de la página oficial de la bodega\" (viñedo, proceso de elaboración, historia de la bodega). Si esa sección dice \"No disponible\" o no aporta contenido sustancial, devuelve descripcion: null — nunca escribas un párrafo genérico de relleno ni completes con conocimiento general.\n\nEstructura obligatoria:\n{\n  \"uva\": \"variedad principal\" | null,\n  \"crianza\": \"tipo de crianza\" | null,\n  \"alcohol\": \"grado alcohólico, ej: 14.5%\" | null,\n  \"temp_servicio\": \"temperatura de servicio, ej: 16-18C\" | null,\n  \"region\": \"región vitivinícola\" | null,\n  \"denominacion\": \"D.O. / I.G.P., ej: DO Ribera del Duero\" | null,\n  \"descripcion\": \"párrafo de 2-4 frases sobre viñedo/elaboración/historia, o null\" | null,\n  \"url_bodega\": \"URL oficial de la bodega comenzando por https://\" | null,\n  \"imagen_url\": null,\n  \"confidence\": \"high\" | \"medium\" | \"low\"\n}\n\nReglas:\n- imagen_url SIEMPRE null\n- url_bodega debe empezar por https:// o devuelve null; si los resultados de búsqueda incluyen la URL oficial de la bodega, úsala\n- confidence=high solo si conoces bien el vino o los resultados de búsqueda lo confirman\n- confidence=medium si es conocido pero con alguna incertidumbre\n- confidence=low si tienes dudas\n- Responde exclusivamente con JSON valido, sin markdown, sin texto adicional"
  },
  {
    "type": "setNodeParameter",
    "nodeName": "OpenAI Enrich",
    "path": "/parameters/responses/values/1/content",
    "value": "={{ 'Enriquece este vino:\\nNombre: ' + ($('Preparar Contexto').first().json.contexto.nombre ?? 'desconocido') + '\\nBodega: ' + ($('Preparar Contexto').first().json.contexto.bodega ?? 'desconocida') + ($('Preparar Contexto').first().json.contexto.anada ? '\\nAnada: ' + $('Preparar Contexto').first().json.contexto.anada : '') + ($('Preparar Contexto').first().json.contexto.region ? '\\nRegion: ' + $('Preparar Contexto').first().json.contexto.region : '') + ($('Preparar Contexto').first().json.contexto.denominacion ? '\\nDO: ' + $('Preparar Contexto').first().json.contexto.denominacion : '') + '\\n\\nResultados de búsqueda web reales (pueden ser parciales, irrelevantes o estar vacíos — solo confirman datos, nunca inventes si no aparece aquí):\\n' + $json.grounding_text_completo }}"
  },
  {
    "type": "setNodeParameter",
    "nodeName": "Parse OpenAI Response",
    "path": "/parameters/jsCode",
    "value": "// F7b — Extraer el objeto de datos ya parseado de la respuesta de OpenAI (primera pasada)\nconst oaiItem = $input.first().json\nlet raw = {}\ntry {\n  const textField = oaiItem?.output?.[0]?.content?.[0]?.text\n  if (textField && typeof textField === 'object') {\n    raw = textField\n  } else if (typeof textField === 'string') {\n    const match = textField.match(/\\{[\\s\\S]*\\}/)\n    raw = match ? JSON.parse(match[0]) : {}\n  } else {\n    const alt = oaiItem.text ?? oaiItem.content ?? oaiItem.message ?? '{}'\n    const altStr = typeof alt === 'string' ? alt : JSON.stringify(alt)\n    const match = altStr.match(/\\{[\\s\\S]*\\}/)\n    raw = match ? JSON.parse(match[0]) : {}\n  }\n} catch {\n  raw = {}\n}\n\nfunction validStr(v) {\n  if (!v || typeof v !== 'string') return null\n  const s = v.trim()\n  return s.length > 0 && s !== 'null' ? s : null\n}\n\nconst uva          = validStr(raw.uva)\nconst crianza      = validStr(raw.crianza)\nconst alcohol      = validStr(raw.alcohol)\nconst tempServicio = validStr(raw.temp_servicio)\nconst region       = validStr(raw.region)\nconst denominacion = validStr(raw.denominacion)\nconst descripcion  = validStr(raw.descripcion)\n\nreturn [{\n  json: {\n    uva,\n    crianza,\n    alcohol,\n    temp_servicio: tempServicio,\n    region,\n    denominacion,\n    descripcion,\n    url_bodega: raw.url_bodega ?? null,\n    confidence: ['high', 'medium', 'low'].includes(raw.confidence) ? raw.confidence : 'low',\n    faltan_campos: !uva || !crianza || !alcohol || !tempServicio || !region || !denominacion,\n  }\n}]\n"
  },
  {
    "type": "setNodeParameter",
    "nodeName": "OpenAI Extraer de Búsqueda",
    "path": "/parameters/responses/values/0/content",
    "value": "Eres un extractor de datos ESTRICTO. Se te da el nombre de un vino/bodega concretos y un texto de resultados de búsqueda web reales (la búsqueda puede no ser perfecta: a veces trae resultados irrelevantes o de una bodega/vino totalmente distinto al indicado).\n\nAntes de extraer cualquier dato, verifica que el texto se refiere inequívocamente AL MISMO vino y bodega indicados (mismo nombre de bodega). Si los resultados hablan de otra bodega u otro vino — aunque contengan datos de vino en general (uva, crianza, etc.) — esos datos NO cuentan y debes devolver null.\n\nTu única tarea es extraer, SOLO SI aparece explícitamente en el texto Y corresponde a ESE vino/bodega exacto, estos campos: uva, crianza, alcohol, temp_servicio, region, denominacion. NUNCA uses conocimiento general ni inventes — si el dato no está literalmente presente para ese vino/bodega, devuelve null para ese campo.\n\nEstructura obligatoria (solo estos 6 campos):\n{\n  \"uva\": \"variedad principal, tal como aparece en el texto\" | null,\n  \"crianza\": \"tipo de crianza, tal como aparece en el texto\" | null,\n  \"alcohol\": \"grado alcohólico, tal como aparece en el texto\" | null,\n  \"temp_servicio\": \"temperatura de servicio, tal como aparece en el texto\" | null,\n  \"region\": \"región vitivinícola, tal como aparece en el texto\" | null,\n  \"denominacion\": \"D.O. / I.G.P., tal como aparece en el texto\" | null\n}\n\nResponde exclusivamente con JSON válido, sin markdown, sin texto adicional."
  },
  {
    "type": "setNodeParameter",
    "nodeName": "Fusionar Campos",
    "path": "/parameters/jsCode",
    "value": "// F7c — Fusionar: completar solo los campos que la primera pasada dejó en null\n// con lo extraído estrictamente del texto de búsqueda (segunda pasada, extractiva).\n// descripcion no pasa por la segunda pasada (es síntesis, no extracción) — se\n// propaga tal cual de la primera pasada.\nconst base = $('Parse OpenAI Response').first().json\n\nconst oaiItem = $input.first().json\nlet extra = {}\ntry {\n  const textField = oaiItem?.output?.[0]?.content?.[0]?.text\n  if (textField && typeof textField === 'object') {\n    extra = textField\n  } else if (typeof textField === 'string') {\n    const match = textField.match(/\\{[\\s\\S]*\\}/)\n    extra = match ? JSON.parse(match[0]) : {}\n  }\n} catch {\n  extra = {}\n}\n\nfunction validStr(v) {\n  if (!v || typeof v !== 'string') return null\n  const s = v.trim()\n  return s.length > 0 && s !== 'null' ? s : null\n}\n\nreturn [{\n  json: {\n    uva:           base.uva           ?? validStr(extra.uva),\n    crianza:       base.crianza       ?? validStr(extra.crianza),\n    alcohol:       base.alcohol       ?? validStr(extra.alcohol),\n    temp_servicio: base.temp_servicio ?? validStr(extra.temp_servicio),\n    region:        base.region        ?? validStr(extra.region),\n    denominacion:  base.denominacion  ?? validStr(extra.denominacion),\n    descripcion:   base.descripcion,\n    url_bodega:    base.url_bodega,\n    confidence:    base.confidence,\n  }\n}]\n"
  },
  {
    "type": "setNodeParameter",
    "nodeName": "Validar Respuesta",
    "path": "/parameters/jsCode",
    "value": "// F8 — Validar y estructurar los campos ya resueltos\n// (primera pasada de OpenAI + fallback extractivo de Brave Search + precio real de mercado)\nconst ctxItem = $('Preparar Contexto').first().json\nconst fields  = $input.first().json\nconst wineUid = ctxItem.wine_uid\nconst ctx     = ctxItem.contexto\nconst now     = new Date().toISOString()\n\nconst globalConf = ['high', 'medium', 'low'].includes(fields.confidence) ? fields.confidence : 'low'\n\nfunction validUrl(v) {\n  if (!v || typeof v !== 'string') return null\n  const s = v.trim()\n  return s.startsWith('https://') ? s : null\n}\n\nfunction trace(value, confidence, source, sourceUrl) {\n  return {\n    value,\n    source:          source ?? 'other',\n    source_url:      sourceUrl ?? '',\n    source_priority: 6,\n    obtained_at:     now,\n    confidence:      confidence ?? globalConf,\n  }\n}\n\n// F8b — Verificación real: OpenAI no navega la web, solo recuerda de su entrenamiento.\n// Antes de aceptar url_bodega, comprobamos que la URL responda de verdad — si no,\n// la descartamos (queda en blanco) en vez de guardar un enlace inventado/roto.\nasync function urlEsAlcanzable(url) {\n  try {\n    const res = await this.helpers.httpRequest({\n      method: 'GET',\n      url,\n      timeout: 8000,\n      simple: false,\n      returnFullResponse: true,\n    })\n    return res.statusCode >= 200 && res.statusCode < 400\n  } catch {\n    return false\n  }\n}\n\nconst enriched = {}\n\nconst uva          = fields.uva\nconst crianza      = fields.crianza\nconst alcohol      = fields.alcohol\nconst tempServicio = fields.temp_servicio\nconst region       = fields.region\nconst denominacion = fields.denominacion\nconst descripcion  = fields.descripcion\nconst precio       = (typeof fields.precio === 'number' && fields.precio > 0) ? fields.precio : null\nlet   urlBodega    = validUrl(fields.url_bodega)\nlet   urlBodegaSource = 'other'\n\nif (urlBodega && !(await urlEsAlcanzable.call(this, urlBodega))) {\n  urlBodega = null\n}\n\n// F8c — Si no hay una URL de bodega válida, probar el candidato real hallado por Brave Search.\nconst candidatoUrlBodega = $('Preparar Grounding').first().json.candidate_url_bodega\nif (!urlBodega) {\n  if (candidatoUrlBodega && await urlEsAlcanzable.call(this, candidatoUrlBodega)) {\n    urlBodega = candidatoUrlBodega\n    urlBodegaSource = 'brave_search'\n  }\n}\n\nif (uva)          enriched.uva          = trace(uva)\nif (crianza)      enriched.crianza      = trace(crianza)\nif (alcohol)      enriched.alcohol      = trace(alcohol)\nif (tempServicio) enriched.temp_servicio = trace(tempServicio)\nif (region)       enriched.region       = trace(region)\nif (denominacion) enriched.denominacion = trace(denominacion)\nif (urlBodega)    enriched.url_bodega   = trace(urlBodega, undefined, urlBodegaSource)\n// F8d — descripcion: solo si el texto de la página oficial confirmó contenido real.\n// source_url apunta a esa misma página — es lo único que alimenta la nota de\n// atribución en la ficha (\"Fuente: dominio.com\").\nif (descripcion)  enriched.descripcion  = trace(descripcion, undefined, 'official_winery', candidatoUrlBodega ?? undefined)\n// F8e — El precio SIEMPRE viene de búsqueda real (Vivino / tiendas online), nunca de la\n// memoria de OpenAI: los precios cambian constantemente y una cifra \"recordada\" sería\n// casi con certeza errónea o desactualizada.\nif (precio !== null) enriched.precio = trace(precio, undefined, 'brave_search')\n\nconst identified_as = [ctx.nombre, ctx.bodega, ctx.anada]\n  .filter(Boolean).join(' — ')\n\nconst fieldCount = Object.keys(enriched).length\nconst enrichConfidence = fieldCount === 0 ? 0\n  : globalConf === 'high'   ? 0.9\n  : globalConf === 'medium' ? 0.6\n  : 0.3\n\nconst sources = fieldCount > 0\n  ? [{ type: 'other', url: '', priority: 6 }]\n  : []\n\nreturn [{\n  json: {\n    wine_uid:          wineUid,\n    identified_as:     identified_as || null,\n    enrich_confidence: enrichConfidence,\n    sources,\n    enriched,\n  }\n}]\n"
  }
]
```

**Nota:** el nodo `¿Faltan Campos?` (IF) no necesita ninguna operación — sigue leyendo `$json.faltan_campos`, que ahora ya viene calculado con la condición ampliada desde `Parse OpenAI Response`. No lo toques.

- [ ] **Step 2: Confirmar que el workflow sigue activo y sin errores de estructura**

Usa `mcp__n8n-mcp__get_workflow_details` con `workflowId: "rV1BrlPmkUB87jnn"`, `detailLevel: "execution"`.
Expected: `active: true`, sin error de validación en la respuesta.

- [ ] **Step 3: Probar contra un caso real sin etiqueta trasera**

Usa `mcp__n8n-mcp__execute_workflow` (o `test_workflow` si `execute_workflow` no ejecuta workflows activos vía webhook — comprobar cuál aplica) con `triggerNodeName: "POST /vinoteca/wine/enrich"` e `inputs.webhookData.body`:
```json
{
  "wine_uid": "test-la-chanin-001",
  "identified_as": {
    "nombre": "La Chanin",
    "bodega": "Cható Gañán",
    "anada": 2020,
    "region": null,
    "denominacion": null
  }
}
```
Expected: la respuesta incluye `enriched.descripcion` con un párrafo sobre viñedo/elaboración (no `null`), y `enriched.descripcion.source_url` apuntando a un dominio de `chatoganan.es`. Si `descripcion` sale `null`, revisar en `docker compose logs` o en la vista de ejecuciones de n8n qué llegó como `grounding_text_completo` — probablemente Brave Search no encontró el candidato o la descarga de la página falló (aceptable, pero confirmar que no es un error de conexión de nodos).

- [ ] **Step 4: Probar contra un caso donde `identity` ya trae región/denominación**

Mismo webhook, con `identified_as.region` y `identified_as.denominacion` ya rellenos con valores reales (p. ej. un Ribera del Duero conocido). Expected: `enriched.region`/`enriched.denominacion` pueden salir vacíos o coincidir — lo importante es que el merge posterior en `Scan.tsx` (Task 4) nunca pisará lo que ya trae `identity`, así que aquí solo hace falta confirmar que el workflow no lanza error con estos campos ya rellenos.

- [ ] **Step 5: Confirmar que un vino sin bodega localizable no rompe nada**

Mismo webhook con una `bodega`/`nombre` inventados que no existan realmente (p. ej. `"bodega": "Bodega Inexistente XYZ123"`). Expected: `enrich_confidence` baja o 0, `enriched.descripcion` ausente, sin error 500 en la respuesta.

---

### Task 4: Frontend — `Scan.tsx` + `useWines.ts`, aplicar los campos nuevos en el merge y persistirlos

**Files:**
- Modify: `src/pages/Scan.tsx:325-375` (bloque de enrich + merge)
- Modify: `src/hooks/useWines.ts` (`createWine`, construcción del objeto `wine`)

- [ ] **Step 1: Ampliar el merge de `wineData`**

Localiza (dentro de la función que hace el merge, cerca de la línea 368-375):
```ts
      // Enriched — solo rellena vacíos (nunca sobreescribe identidad)
      uva:          (enriched.uva?.value          as string | undefined) ?? scanResult.uva          ?? undefined,
      alcohol:      (enriched.alcohol?.value      as string | undefined) ?? scanResult.alcohol      ?? undefined,
      crianza:      (enriched.crianza?.value      as string | undefined) ?? scanResult.crianza      ?? undefined,
      temp_servicio:(enriched.temp_servicio?.value as string | undefined) ?? scanResult.temp_servicio ?? undefined,
      url_bodega:   (enriched.url_bodega?.value   as string | undefined) ?? scanResult.url_bodega   ?? undefined,
      descripcion:  scanResult.descripcion ?? undefined,
    }
```
Sustitúyelo por:
```ts
      // Enriched — solo rellena vacíos (nunca sobreescribe identidad)
      uva:          (enriched.uva?.value          as string | undefined) ?? scanResult.uva          ?? undefined,
      alcohol:      (enriched.alcohol?.value      as string | undefined) ?? scanResult.alcohol      ?? undefined,
      crianza:      (enriched.crianza?.value      as string | undefined) ?? scanResult.crianza      ?? undefined,
      temp_servicio:(enriched.temp_servicio?.value as string | undefined) ?? scanResult.temp_servicio ?? undefined,
      url_bodega:   (enriched.url_bodega?.value   as string | undefined) ?? scanResult.url_bodega   ?? undefined,
      region:       (enriched.region?.value       as string | undefined) ?? identity.region        ?? undefined,
      denominacion: (enriched.denominacion?.value as string | undefined) ?? identity.denominacion  ?? undefined,
      descripcion:  (enriched.descripcion?.value  as string | undefined) ?? scanResult.descripcion  ?? undefined,
      descripcion_fuente_url: (enriched.descripcion?.source_url as string | undefined) || undefined,
      precio:       (enriched.precio?.value       as number | undefined) ?? undefined,
    }
```

**Nota:** `identity` ya está definida más arriba en la misma función (es el objeto `{ nombre, bodega, anada, region, denominacion }` que ya usan `region`/`denominacion` en el bloque "Identidad — fuente de verdad" unas líneas antes de este merge) — no hace falta declarar nada nuevo, solo referenciarla aquí igual que ya se hace para `nombre`/`bodega`. `descripcion_fuente_url` usa `||` en vez de `??` porque `FieldTrace.source_url` puede venir como cadena vacía `''` (así lo inicializa `trace()` en n8n cuando no hay URL) y una cadena vacía no debe considerarse una fuente válida.

- [ ] **Step 2: Persistir `descripcion_fuente_url` en `createWine`**

`precio` ya se persiste hoy (`precio: data.precio ?? null,` ya existe en `useWines.ts`) — pero `createWine` construye el objeto a insertar con una lista explícita de campos, así que `descripcion_fuente_url` necesita añadirse ahí explícitamente o se perdería silenciosamente al guardar aunque `Scan.tsx` ya lo calcule.

Localiza en `src/hooks/useWines.ts`, dentro de `createWine`:
```ts
      descripcion:        data.descripcion   ?? null,
      url_bodega:         data.url_bodega    ?? null,
```
Sustitúyelo por:
```ts
      descripcion:        data.descripcion   ?? null,
      descripcion_fuente_url: data.descripcion_fuente_url ?? null,
      url_bodega:         data.url_bodega    ?? null,
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc -b`
Expected: sin salida (build limpio).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Scan.tsx src/hooks/useWines.ts
git commit -m "feat(scan): aplicar region/denominacion/descripcion/precio enriquecidos en el merge y persistir descripcion_fuente_url"
```

---

### Task 5: Frontend — `WineDetail.tsx`, nota de atribución bajo `descripcion`

**Files:**
- Modify: `src/pages/WineDetail.tsx:611-615`

- [ ] **Step 1: Añadir la nota de atribución**

Localiza (cerca de la línea 605, justo antes del bloque de `descripcion`):
```ts
        {tieneInfo && (
          <div style={{ padding: '18px 16px 0' }}>
            <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.muted, fontWeight: 600, marginBottom: 11 }}>
              Información del vino
            </div>
            {wine.descripcion && (
              <p style={{ fontSize: '0.84rem', color: theme.colors.cream, lineHeight: 1.65, opacity: 0.88, marginBottom: wine.url_bodega ? 10 : 0 }}>
                {wine.descripcion}
              </p>
            )}
```
Sustitúyelo por:
```ts
        {tieneInfo && (
          <div style={{ padding: '18px 16px 0' }}>
            <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.muted, fontWeight: 600, marginBottom: 11 }}>
              Información del vino
            </div>
            {wine.descripcion && (
              <p style={{ fontSize: '0.84rem', color: theme.colors.cream, lineHeight: 1.65, opacity: 0.88, marginBottom: 4 }}>
                {wine.descripcion}
              </p>
            )}
            {wine.descripcion && wine.descripcion_fuente_url && (
              <a
                href={wine.descripcion_fuente_url}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', fontSize: '0.68rem', color: theme.colors.muted,
                  textDecoration: 'none', marginBottom: wine.url_bodega ? 10 : 0,
                }}
              >
                Fuente: {wine.descripcion_fuente_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}
              </a>
            )}
```

**Nota:** `wine.descripcion_fuente_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')` limpia la URL a solo el dominio (`chatoganan.es` en vez de `https://chatoganan.es/tienda/producto/la-chanin/`) — mismo estilo que ya usa `urlDisplay` en este fichero para `url_bodega`, pero recortando también la ruta, ya que aquí la URL suele ser una página de producto larga, no la home de la bodega.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sin salida (build limpio).

- [ ] **Step 3: Verificación visual manual**

Run: `npm run dev`, abrir un vino de la bodega que tenga `descripcion` y `descripcion_fuente_url` rellenos (tras probar Task 3/4 con un escaneo real, o rellenando esos dos campos a mano en la tabla `wines` vía `mcp__supabase__execute_sql` para una prueba rápida sin depender del flujo de escaneo completo). Expected: aparece la línea "Fuente: `<dominio>`" bajo el párrafo, clicable, sin romper el layout del bloque "Información del vino" cuando también hay `url_bodega`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/WineDetail.tsx
git commit -m "feat(wine-detail): mostrar nota de atribución de la fuente de descripcion"
```

---

### Task 6: Verificación end-to-end

**Files:** ninguno — solo verificación.

- [ ] **Step 1: Build completo**

Run: `npx tsc -b && npm run build`
Expected: ambos comandos terminan sin error.

- [ ] **Step 2: Escaneo real de un vino sin etiqueta trasera**

Con `npm run dev` corriendo, escanear (o simular vía el flujo normal de la app) un vino de autor sin trasera — puede ser la propia botella La Chanin usada durante el diseño. Expected: el formulario de revisión tras el escaneo llega con `Región`, `D.O./I.G.P.` y `Descripción` rellenos si la búsqueda encontró algo real (o vacíos si no, nunca con datos inventados); al guardar, la ficha del vino muestra la nota de atribución bajo la descripción.

- [ ] **Step 3: Actualizar el roadmap**

Añadir una línea en `docs/roadmap/fase-11-optimizacion.md` (o el fichero de roadmap que corresponda a Fase de identificación/enriquecimiento, revisar `docs/roadmap.md` para ubicar la fase correcta si no es la 11) confirmando que el enrich amplía region/denominacion/descripcion — mismo estilo que las entradas ya existentes en "Decisiones técnicas" de ese fichero. No es un paso de código, es documentación de cierre.

- [ ] **Step 4: Commit final si Step 3 tocó algo**

```bash
git add docs/roadmap/
git commit -m "docs(roadmap): registrar la ampliación del enrich con region/denominacion/descripcion"
git push
```
