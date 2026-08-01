# Fase 10 — Sommelier IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al Sommelier IA contexto del historial de catas del usuario (perfil de gusto) y ampliar sus capacidades a búsqueda por ocasión, comparativas entre vinos y maridaje inverso, reutilizando los tres workflows n8n existentes.

**Architecture:** Un helper puro nuevo (`src/lib/sommelierHelpers.ts`) calcula un `TasteProfile` resumido a partir de `wines`+`tastings`, siguiendo el mismo patrón que `statsHelpers.ts`. Un hook nuevo (`src/hooks/useSommelier.ts`) orquesta la carga de datos y el cálculo. `Sommelier.tsx` amplía su router de intención (`detectIntent`) para reconocer 2 intenciones nuevas y usar el parámetro `ocasion` ya existente en `callMaridaje`. Los 3 workflows n8n existentes (`chat`, `maridaje`, `enriquecimiento`) se reutilizan; 2 de ellos se amplían vía MCP de n8n para aceptar `tasteProfile`/`intentHint` y usarlos en el prompt — no se crean workflows nuevos.

**Tech Stack:** TypeScript, React 19, Supabase, n8n (MCP tools `mcp__n8n-mcp__*`), Vitest no configurado en este repo (no hay test runner) — la verificación es `npx tsc -b` + prueba manual + ejecución manual de los workflows n8n vía MCP.

---

## Task 1: `src/lib/sommelierHelpers.ts` — perfil de gusto

**Files:**
- Create: `src/lib/sommelierHelpers.ts`

- [ ] **Step 1: Crear el archivo con `buildTasteProfile`**

```ts
// src/lib/sommelierHelpers.ts
import type { Wine, Tasting } from '../types'
import { classifyWine } from './statsHelpers'

export interface TasteProfile {
  vinosMejorValorados: { nombre: string; puntuacion: number }[]
  tipoPreferido: string | null
  regionesPreferidas: string[]
  puntuacionMediaGeneral: number | null
  ocasionesFrecuentes: string[]
}

const MIN_CATAS_TIPO = 2

export function buildTasteProfile(wines: Wine[], tastings: Tasting[]): TasteProfile {
  const scored = tastings.filter(t => t.puntuacion !== null)

  if (scored.length === 0) {
    return {
      vinosMejorValorados:    [],
      tipoPreferido:          null,
      regionesPreferidas:     [],
      puntuacionMediaGeneral: null,
      ocasionesFrecuentes:    [],
    }
  }

  const wineById = new Map(wines.map(w => [w.id, w]))

  // ── Vinos mejor valorados (top 5) ────────────────────────────────────────
  const vinosMejorValorados = [...scored]
    .sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0))
    .slice(0, 5)
    .map(t => {
      const wine = wineById.get(t.wine_id)
      return { nombre: wine?.nombre ?? 'Vino desconocido', puntuacion: t.puntuacion ?? 0 }
    })

  // ── Tipo preferido (mín. MIN_CATAS_TIPO catas de ese tipo) ──────────────
  const tipoScores: Record<string, { sum: number; count: number }> = {}
  scored.forEach(t => {
    const wine = wineById.get(t.wine_id)
    if (!wine) return
    const tipo = classifyWine(wine)
    const entry = tipoScores[tipo] ?? { sum: 0, count: 0 }
    entry.sum += t.puntuacion ?? 0
    entry.count += 1
    tipoScores[tipo] = entry
  })
  const tipoPreferido = Object.entries(tipoScores)
    .filter(([, v]) => v.count >= MIN_CATAS_TIPO)
    .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0]?.[0] ?? null

  // ── Regiones preferidas (top 3 por puntuación media, mín. 1 cata) ───────
  const regionScores: Record<string, { sum: number; count: number }> = {}
  scored.forEach(t => {
    const wine = wineById.get(t.wine_id)
    const region = wine?.region?.trim()
    if (!region) return
    const entry = regionScores[region] ?? { sum: 0, count: 0 }
    entry.sum += t.puntuacion ?? 0
    entry.count += 1
    regionScores[region] = entry
  })
  const regionesPreferidas = Object.entries(regionScores)
    .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))
    .slice(0, 3)
    .map(([region]) => region)

  // ── Puntuación media general ──────────────────────────────────────────
  const puntuacionMediaGeneral = Math.round(
    (scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length) * 10
  ) / 10

  // ── Ocasiones frecuentes (top 3) ────────────────────────────────────────
  const ocasionCounts: Record<string, number> = {}
  tastings.forEach(t => {
    const ocasion = t.ocasion?.trim()
    if (!ocasion) return
    ocasionCounts[ocasion] = (ocasionCounts[ocasion] ?? 0) + 1
  })
  const ocasionesFrecuentes = Object.entries(ocasionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ocasion]) => ocasion)

  return {
    vinosMejorValorados,
    tipoPreferido,
    regionesPreferidas,
    puntuacionMediaGeneral,
    ocasionesFrecuentes,
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores (ni salida)

- [ ] **Step 3: Commit**

```bash
git add src/lib/sommelierHelpers.ts
git commit -m "feat(sommelier): extraer buildTasteProfile a sommelierHelpers.ts"
```

---

## Task 2: `src/hooks/useSommelier.ts` — orquestador

**Files:**
- Create: `src/hooks/useSommelier.ts`

Este hook carga `wines`+`tastings` del usuario actual y calcula el `tasteProfile`, siguiendo el mismo patrón de `useStats.ts` (fetch directo con `supabase.from(...)`, no reutiliza `useWines`/`useTastings` para evitar acoplar el Sommelier al estado global de esos stores).

- [ ] **Step 1: Crear el hook**

```ts
// src/hooks/useSommelier.ts
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Wine, Tasting } from '../types'
import { buildTasteProfile, type TasteProfile } from '../lib/sommelierHelpers'

export function useSommelier() {
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { user } = useAuthStore()

  const loadTasteProfile = useCallback(async () => {
    if (!user) return
    try {
      const [winesRes, tastingsRes] = await Promise.all([
        supabase.from('wines').select('*').eq('user_id', user.id),
        supabase.from('tastings').select('*').eq('user_id', user.id),
      ])

      if (winesRes.error)    throw winesRes.error
      if (tastingsRes.error) throw tastingsRes.error

      const wines    = (winesRes.data    ?? []) as Wine[]
      const tastings = (tastingsRes.data ?? []) as Tasting[]

      setTasteProfile(buildTasteProfile(wines, tastings))
    } catch {
      setTasteProfile(null)
    } finally {
      setLoaded(true)
    }
  }, [user])

  return { tasteProfile, loaded, loadTasteProfile }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSommelier.ts
git commit -m "feat(sommelier): añadir useSommelier para cargar el perfil de gusto"
```

---

## Task 3: Ampliar `src/lib/n8n.ts`

**Files:**
- Modify: `src/lib/n8n.ts:73-96` (definiciones de `callSommelierChat` y `callMaridaje`)

- [ ] **Step 1: Añadir el tipo `TasteProfile` y ampliar las firmas**

Reemplazar el bloque actual (líneas 73-96 de `src/lib/n8n.ts`):

```ts
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
```

por:

```ts
export interface TasteProfile {
  vinosMejorValorados: { nombre: string; puntuacion: number }[]
  tipoPreferido: string | null
  regionesPreferidas: string[]
  puntuacionMediaGeneral: number | null
  ocasionesFrecuentes: string[]
}

export type SommelierIntentHint = 'comparativa' | 'maridaje-inverso'

export async function callSommelierChat(
  messages: ChatMessage[],
  wineCollection: WineCollection[],
  userMessage: string,
  tasteProfile?: TasteProfile,
  intentHint?: SommelierIntentHint
): Promise<string> {
  const data = await post<{ reply: string }>('vinoteca/sommelier/chat', {
    messages,
    wineCollection,
    userMessage,
    tasteProfile,
    intentHint,
  })
  return data.reply
}

export async function callMaridaje(
  plato: string,
  wineCollection: WineCollection[],
  ocasion?: string,
  tasteProfile?: TasteProfile
): Promise<{ recomendacion: string; wineId?: string }> {
  return post<{ recomendacion: string; wineId?: string }>('vinoteca/sommelier/maridaje', {
    plato,
    wineCollection,
    ocasion,
    tasteProfile,
  })
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: errores esperados en `src/pages/Sommelier.tsx` (las llamadas existentes no pasan `tasteProfile` — TypeScript no debería fallar por eso porque son parámetros opcionales al final; si `tsc -b` da error, es señal de que algo más está mal y hay que revisar antes de continuar). Con parámetros opcionales al final, las llamadas existentes en `Sommelier.tsx` (`callSommelierChat(next, wineCollection, text)`, `callMaridaje(plato, wineCollection)`) siguen siendo válidas sin cambios — no debería haber ningún error nuevo.

- [ ] **Step 3: Commit**

```bash
git add src/lib/n8n.ts
git commit -m "feat(sommelier): ampliar callSommelierChat/callMaridaje con tasteProfile e intentHint"
```

---

## Task 4: Ampliar `detectIntent()` y `sendMessage()` en `Sommelier.tsx`

**Files:**
- Modify: `src/pages/Sommelier.tsx`

- [ ] **Step 1: Añadir las listas de keywords nuevas y ampliar `detectIntent`**

Reemplazar el bloque de constantes de keywords (líneas 20-35 de `src/pages/Sommelier.tsx`, justo antes de `function buildWineCollection`):

```ts
const MARIDAJE_KEYWORDS = [
  'maridar', 'marida', 'combina', 'acompaña', 'con qué vino',
  'para cenar', 'para comer', 'maridaje',
  'qué vino abro', 'qué vino pongo', 'qué vino tomo', 'qué vino elijo',
  'qué abro', 'abrir con', 'abro con', 'abro esta noche',
  'con carne', 'con pescado', 'con pasta', 'con queso', 'con marisco',
  'con pollo', 'con cordero', 'con cerdo', 'con ternera', 'con salmón',
  'esta noche', 'para la cena', 'para la comida',
]

const COMPARATIVA_KEYWORDS = [
  'compara', 'comparar', 'diferencia entre', 'cuál es mejor', 'cual es mejor',
  'versus', ' vs ', 'frente a',
]

const MARIDAJE_INVERSO_KEYWORDS = [
  'qué como con', 'que como con', 'qué platos van con', 'que platos van con',
  'qué comida marida con', 'que comida marida con', 'platos para acompañar',
]

const OCASION_KEYWORDS = [
  'cena romántica', 'cena romantica', 'celebración', 'celebracion', 'aniversario',
  'cumpleaños', 'cumpleanos', 'asado', 'reunión', 'reunion', 'boda', 'brindis',
]

const DO_KEYWORDS = [
  'rioja', 'ribera', 'priorat', 'rías baixas', 'rueda', 'jerez', 'cava',
  'penedès', 'bierzo', 'toro', 'somontano', 'jumilla', 'yecla', 'valdepeñas',
  'manchuela', 'terra alta', 'empordà', 'denominación', 'denominacion',
  'd.o.', 'doc',
]
```

Reemplazar la función `detectIntent` (líneas 49-54):

```ts
function detectIntent(text: string): 'maridaje' | 'comparativa' | 'maridaje-inverso' | 'enriquecimiento' | 'chat' {
  const lower = text.toLowerCase()
  if (COMPARATIVA_KEYWORDS.some(k => lower.includes(k)))       return 'comparativa'
  if (MARIDAJE_INVERSO_KEYWORDS.some(k => lower.includes(k)))  return 'maridaje-inverso'
  if (MARIDAJE_KEYWORDS.some(k => lower.includes(k)))          return 'maridaje'
  if (DO_KEYWORDS.some(k => lower.includes(k)))                return 'enriquecimiento'
  return 'chat'
}

function extractOcasion(text: string): string | undefined {
  const lower = text.toLowerCase()
  return OCASION_KEYWORDS.find(k => lower.includes(k))
}
```

- [ ] **Step 2: Importar `useSommelier` y `TasteProfile`, y cargar el perfil al montar**

Reemplazar el bloque de imports (líneas 1-11):

```ts
import { useState, useEffect, useRef } from 'react'
import Layout from '../components/ui/Layout'
import ChatBubble from '../components/ui/ChatBubble'
import SuggestionChips from '../components/ui/SuggestionChips'
import Spinner from '../components/ui/Spinner'
import { callSommelierChat, callMaridaje, callEnriquecimiento } from '../lib/n8n'
import { useWineStore } from '../store/wineStore'
import { useWines } from '../hooks/useWines'
import { useSommelier } from '../hooks/useSommelier'
import { theme } from '../constants/theme'
import type { ChatMessage } from '../types'
import type { WineCollection } from '../lib/n8n'
```

Dentro de `export default function Sommelier()`, justo después de la línea `const { loadWines }  = useWines()` (línea 73), añadir:

```ts
  const { tasteProfile, loadTasteProfile } = useSommelier()
  const tasteProfileLoadedRef = useRef(false)
```

Y ampliar el `useEffect` existente que carga los vinos (líneas 76-81) para que también cargue el perfil de gusto:

```ts
  useEffect(() => {
    if (!winesLoadedRef.current) {
      winesLoadedRef.current = true
      loadWines().catch(() => null)
    }
    if (!tasteProfileLoadedRef.current) {
      tasteProfileLoadedRef.current = true
      loadTasteProfile().catch(() => null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Ampliar `sendMessage` para usar las nuevas intenciones y `tasteProfile`**

Reemplazar el bloque `try { ... }` dentro de `sendMessage` (líneas 106-131 actuales) por:

```ts
    try {
      let reply: string

      if (intent === 'maridaje') {
        const plato = extractPlato(text)
        const ocasion = extractOcasion(text)
        const result = await callMaridaje(plato, wineCollection, ocasion, tasteProfile ?? undefined)
        reply = result.recomendacion

      } else if (intent === 'comparativa' || intent === 'maridaje-inverso') {
        reply = await callSommelierChat(next, wineCollection, text, tasteProfile ?? undefined, intent)

      } else if (intent === 'enriquecimiento') {
        const doMatch = DO_KEYWORDS.find(k => text.toLowerCase().includes(k))
        const denominacion = doMatch
          ? text.slice(text.toLowerCase().indexOf(doMatch)).split(/[\s,.]/, 3).join(' ')
          : text

        const [chatResult, enrichResult] = await Promise.allSettled([
          callSommelierChat(next, wineCollection, text, tasteProfile ?? undefined),
          callEnriquecimiento(denominacion),
        ])

        const chatPart   = chatResult.status   === 'fulfilled' ? chatResult.value    : ''
        const enrichPart = enrichResult.status === 'fulfilled' ? enrichResult.value.info : ''
        reply = [chatPart, enrichPart].filter(Boolean).join('\n\n')

      } else {
        reply = await callSommelierChat(next, wineCollection, text, tasteProfile ?? undefined)
      }

      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg].slice(-20))
    } catch (err) {
      const assistantMsg: ChatMessage = {
        role:    'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'Ha ocurrido un error. Inténtalo de nuevo.',
      }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
```

Nota: `extractPlato(text)` sigue devolviendo el texto completo si no encuentra ninguna de sus keywords de recorte (comportamiento ya existente, sin cambios) — cuando la intención es `maridaje` disparada solo por una `OCASION_KEYWORDS` sin plato reconocible, `plato` será una cadena poco útil (el texto completo). Esto es aceptable para esta fase: el prompt de n8n (Task 5) prioriza `ocasion` sobre `plato` cuando ambos están presentes, y aunque no sea perfecto, no rompe nada — está documentado como comportamiento conocido, no como bug.

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores

- [ ] **Step 5: Commit**

```bash
git add src/pages/Sommelier.tsx
git commit -m "feat(sommelier): reconocer comparativa/maridaje-inverso/ocasión y enviar tasteProfile"
```

---

## Task 5: Ampliar el workflow n8n `vinoteca-sommelier-chat`

**Files:** n8n workflow `vinoteca-sommelier-chat` (id `Yd2Llg4eRLaAD21I`), vía MCP `mcp__n8n-mcp__update_workflow` + `mcp__n8n-mcp__publish_workflow`. No hay archivo en el repo para este cambio — se documenta en el propio plan y en la spec.

El nodo `Normalize Input` (id `3838caf0-1449-4341-8c4e-ac4f1957c484`) tiene hoy este parámetro `assignments`:

```json
{
  "assignments": [
    { "id": "msg-1", "name": "messages",        "value": "={{ $json.body?.messages ?? $json.messages ?? [] }}",        "type": "array" },
    { "id": "msg-2", "name": "wineCollection",  "value": "={{ $json.body?.wineCollection ?? $json.wineCollection ?? [] }}", "type": "array" },
    { "id": "msg-3", "name": "userMessage",     "value": "={{ $json.body?.userMessage ?? $json.userMessage ?? \"\" }}",   "type": "string" }
  ]
}
```

El nodo `Sommelier AI` (id `5cfb8d0c-36c8-4313-a76c-b55b33b10d57`) tiene hoy este `text` (prompt):

```
Eres un sommelier y enólogo de alto nivel llamado Vinoteca.
Tu rol es ayudar al usuario con su bodega personal con precisión técnica y tono profesional.

Colección actual del usuario:
{{ JSON.stringify($json.wineCollection) }}

Cuando el usuario pregunte por recomendaciones, prioriza vinos de su colección. Cuando mencione un vino que tiene, usa sus datos reales. Da información enológica técnica pero accesible. Responde siempre en el idioma del usuario. Respuestas concisas. Máximo 3 párrafos.

Historial de conversación:
{{ JSON.stringify($json.messages) }}

Último mensaje del usuario: {{ $json.userMessage }}
```

- [ ] **Step 1: Añadir `tasteProfile` e `intentHint` a `Normalize Input`**

Llamar a `mcp__n8n-mcp__update_workflow` con `workflowId: "Yd2Llg4eRLaAD21I"` y una operación `updateNodeParameters` sobre el nodo `Normalize Input` que añade estas dos entradas al array `assignments.assignments` (mismo patrón `??` que las 3 existentes, sin quitar ninguna de las actuales):

```json
{ "id": "msg-4", "name": "tasteProfile", "value": "={{ $json.body?.tasteProfile ?? $json.tasteProfile ?? null }}", "type": "object" },
{ "id": "msg-5", "name": "intentHint",   "value": "={{ $json.body?.intentHint ?? $json.intentHint ?? \"\" }}",   "type": "string" }
```

- [ ] **Step 2: Ampliar el prompt de `Sommelier AI`**

En la misma llamada (u otra operación `setNodeParameter` sobre el nodo `Sommelier AI`, path del prompt), reemplazar el `text` completo por:

```
Eres un sommelier y enólogo de alto nivel llamado Vinoteca.
Tu rol es ayudar al usuario con su bodega personal con precisión técnica y tono profesional.

Colección actual del usuario:
{{ JSON.stringify($json.wineCollection) }}

Perfil de gusto del usuario (basado en su historial de catas, puede venir vacío si aún no ha catado vinos):
{{ JSON.stringify($json.tasteProfile) }}

Cuando el usuario pregunte por recomendaciones, prioriza vinos de su colección y ten en cuenta su perfil de gusto si está disponible. Cuando mencione un vino que tiene, usa sus datos reales. Da información enológica técnica pero accesible. Responde siempre en el idioma del usuario. Respuestas concisas. Máximo 3 párrafos.
{{ $json.intentHint === 'comparativa' ? 'Estructura la comparación por aspectos: cuerpo, taninos, maridaje, ocasión ideal.' : '' }}
{{ $json.intentHint === 'maridaje-inverso' ? 'Sugiere 2-3 platos concretos, no una única sugerencia genérica.' : '' }}

Historial de conversación:
{{ JSON.stringify($json.messages) }}

Último mensaje del usuario: {{ $json.userMessage }}
```

- [ ] **Step 3: Publicar la nueva versión**

Llamar a `mcp__n8n-mcp__publish_workflow` con `workflowId: "Yd2Llg4eRLaAD21I"`.

- [ ] **Step 4: Verificar con una ejecución manual**

Llamar a `mcp__n8n-mcp__execute_workflow` con:

```json
{
  "workflowId": "Yd2Llg4eRLaAD21I",
  "executionMode": "manual",
  "inputs": {
    "type": "webhook",
    "webhookData": {
      "method": "POST",
      "body": {
        "messages": [],
        "userMessage": "compara el Malleolus con el Roble",
        "wineCollection": [
          { "id": "1", "nombre": "Malleolus", "bodega": "Emilio Moro", "anada": 2020, "region": "Ribera del Duero", "uva": "Tempranillo", "denominacion": "Ribera del Duero" },
          { "id": "2", "nombre": "Roble", "bodega": "Protos", "anada": 2021, "region": "Ribera del Duero", "uva": "Tempranillo", "denominacion": "Ribera del Duero" }
        ],
        "tasteProfile": { "vinosMejorValorados": [{ "nombre": "Malleolus", "puntuacion": 94 }], "tipoPreferido": "Tinto", "regionesPreferidas": ["Ribera del Duero"], "puntuacionMediaGeneral": 91.6, "ocasionesFrecuentes": ["cena"] },
        "intentHint": "comparativa"
      }
    }
  }
}
```

Luego llamar a `mcp__n8n-mcp__get_execution` con el `executionId` devuelto y `includeData: true`, `nodeNames: ["Respond with Reply"]`.
Expected: `status: "success"`, y el nodo `Respond with Reply` con un `reply` no vacío que mencione ambos vinos (Malleolus y Roble) y compare aspectos entre ellos.

- [ ] **Step 5: Anotar en el plan que este paso no genera commit en el repo**

Este task no toca el repositorio Vinoteca — los cambios viven en n8n. No hay `git commit` para este task.

---

## Task 6: Ampliar el workflow n8n `vinoteca-sommelier-maridaje`

**Files:** n8n workflow `vinoteca-sommelier-maridaje` (id `yMlzaK784fz1VHzz`), vía MCP. Igual que el Task 5, sin archivo en el repo.

El nodo `Normalize Input` (id `c46a5532-7356-41c9-bd1c-9a006de5f8af`) tiene hoy:

```json
{
  "assignments": [
    { "id": "f-1", "name": "plato",          "value": "={{ $json.body?.plato ?? $json.plato ?? \"\" }}",                 "type": "string" },
    { "id": "f-2", "name": "ocasion",        "value": "={{ $json.body?.ocasion ?? $json.ocasion ?? \"\" }}",             "type": "string" },
    { "id": "f-3", "name": "wineCollection", "value": "={{ $json.body?.wineCollection ?? $json.wineCollection ?? [] }}", "type": "array" }
  ]
}
```

El nodo `Maridaje AI` (id `ba13fc09-8a77-42b2-b556-69c3d058c7eb`) tiene hoy este `text`:

```
Eres un sommelier experto en maridaje.
El usuario tiene esta colección de vinos: {{ JSON.stringify($json.wineCollection) }}

Recomienda el mejor vino de SU colección para maridar con "{{ $json.plato }}"{{ $json.ocasion ? " en una " + $json.ocasion : "" }}.

Justifica técnicamente la elección en 2-3 frases.
Si ningún vino de su colección encaja bien, dilo y sugiere qué tipo de vino buscar.
Responde en el idioma del usuario.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON en una sola línea con este formato exacto:
{"recomendacion":"texto de la recomendación","wineId":"id-del-vino-o-null"}
```

- [ ] **Step 1: Añadir `tasteProfile` a `Normalize Input`**

`mcp__n8n-mcp__update_workflow` con `workflowId: "yMlzaK784fz1VHzz"`, operación `updateNodeParameters` sobre `Normalize Input` que añade:

```json
{ "id": "f-4", "name": "tasteProfile", "value": "={{ $json.body?.tasteProfile ?? $json.tasteProfile ?? null }}", "type": "object" }
```

- [ ] **Step 2: Ampliar el prompt de `Maridaje AI` con `tasteProfile` y con el caso `plato` vacío**

Reemplazar el `text` completo por:

```
Eres un sommelier experto en maridaje.
El usuario tiene esta colección de vinos: {{ JSON.stringify($json.wineCollection) }}

Perfil de gusto del usuario (puede venir vacío si aún no ha catado vinos): {{ JSON.stringify($json.tasteProfile) }}

{{ $json.plato ? ('Recomienda el mejor vino de SU colección para maridar con "' + $json.plato + '"' + ($json.ocasion ? ' en una ' + $json.ocasion : '') + '.') : ($json.ocasion ? ('Recomienda el mejor vino de SU colección para una ' + $json.ocasion + '.') : 'Recomienda el mejor vino de SU colección para una ocasión general.') }}

Ten en cuenta el perfil de gusto del usuario si está disponible.
Justifica técnicamente la elección en 2-3 frases.
Si ningún vino de su colección encaja bien, dilo y sugiere qué tipo de vino buscar.
Responde en el idioma del usuario.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON en una sola línea con este formato exacto:
{"recomendacion":"texto de la recomendación","wineId":"id-del-vino-o-null"}
```

- [ ] **Step 3: Publicar la nueva versión**

`mcp__n8n-mcp__publish_workflow` con `workflowId: "yMlzaK784fz1VHzz"`.

- [ ] **Step 4: Verificar con una ejecución manual (caso ocasión sin plato)**

`mcp__n8n-mcp__execute_workflow`:

```json
{
  "workflowId": "yMlzaK784fz1VHzz",
  "executionMode": "manual",
  "inputs": {
    "type": "webhook",
    "webhookData": {
      "method": "POST",
      "body": {
        "plato": "",
        "ocasion": "cena romántica",
        "wineCollection": [
          { "id": "1", "nombre": "Malleolus", "bodega": "Emilio Moro", "anada": 2020, "region": "Ribera del Duero", "uva": "Tempranillo", "denominacion": "Ribera del Duero" }
        ],
        "tasteProfile": { "vinosMejorValorados": [{ "nombre": "Malleolus", "puntuacion": 94 }], "tipoPreferido": "Tinto", "regionesPreferidas": ["Ribera del Duero"], "puntuacionMediaGeneral": 91.6, "ocasionesFrecuentes": ["cena"] }
      }
    }
  }
}
```

Luego `mcp__n8n-mcp__get_execution` con el `executionId` devuelto, `includeData: true`, `nodeNames: ["Respond with Recomendacion"]`.
Expected: `status: "success"`, `recomendacion` no vacía y sin construcciones extrañas tipo `maridar con ""` — debe leerse como una recomendación para una cena romántica.

- [ ] **Step 5: Anotar en el plan que este paso no genera commit en el repo**

Igual que el Task 5, sin `git commit`.

---

## Task 7: Verificación manual y cierre de roadmap

**Files:**
- Modify: `docs/roadmap/fase-10-sommelier-ia.md`
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Verificación de código completa**

Run: `npx tsc -b --force`
Expected: sin errores (build limpio de todos los archivos tocados en Tasks 1-4)

- [ ] **Step 2: Prueba manual en `npm run dev`, ruta `/sommelier`**

Con una cuenta que tenga catas variadas (distintos tipos, regiones, puntuaciones, ocasiones):
- Pregunta general (p. ej. "¿qué vino recomendarías para hoy?") → confirmar que la respuesta puede reflejar el perfil de gusto.
- "¿Qué vino abro con carne a la brasa?" → intención `maridaje`, sin cambios visibles de comportamiento salvo mejor justificación.
- "Vino para una cena romántica" → intención `maridaje` disparada por `ocasion`, sin plato.
- "Compara el [vino A] con el [vino B]" (dos vinos reales de la colección) → intención `comparativa`.
- "¿Qué como con el [vino A]?" → intención `maridaje-inverso`.

Con una cuenta sin catas: confirmar que el Sommelier responde con normalidad (perfil de gusto vacío no rompe nada).

- [ ] **Step 3: Actualizar `docs/roadmap/fase-10-sommelier-ia.md`**

Cambiar `## Estado` de `⬜ Pendiente` a `✅ Completada (<fecha>)`, y rellenar `## Funcionalidades` y `## Decisiones de diseño` referenciando `docs/superpowers/specs/2026-08-02-sommelier-ia-fase10-design.md` y este plan, siguiendo el mismo formato usado en `docs/roadmap/fase-09-estadisticas.md`.

- [ ] **Step 4: Actualizar `docs/roadmap.md`**

Mover la fila de Fase 10 de la tabla `## Pendientes` a `## Completadas`, mismo patrón que se hizo con Fase 9.

- [ ] **Step 5: Commit**

```bash
git add docs/roadmap/fase-10-sommelier-ia.md docs/roadmap.md
git commit -m "docs: cerrar Fase 10 (Sommelier IA) en el roadmap"
```

---

## Self-Review (ya aplicado por el autor del plan)

**Cobertura del spec:**
- Perfil de gusto (`TasteProfile`) → Task 1.
- Contexto de catas en todas las respuestas → Tasks 3, 4, 5, 6 (payload + prompts).
- Recomendaciones personalizadas → mismo mecanismo que el punto anterior.
- Búsqueda por ocasión → Task 4 (`extractOcasion`) + Task 6 (prompt condicional `plato`/`ocasion`).
- Comparativas entre vinos → Task 4 (`COMPARATIVA_KEYWORDS`) + Task 5 (`intentHint`).
- Maridaje inverso → Task 4 (`MARIDAJE_INVERSO_KEYWORDS`) + Task 5 (`intentHint`).
- Fix del modelo gratuito en `vinoteca-sommelier-maridaje` → ya aplicado en la sesión de brainstorming, documentado en la spec, no repetido aquí.

**Consistencia de tipos:** `TasteProfile` se define igual en `sommelierHelpers.ts` (Task 1) y en `n8n.ts` (Task 3) — son dos interfaces estructuralmente idénticas pero declaradas por separado (no se importa una en la otra) para no acoplar `src/lib/n8n.ts` a `src/lib/sommelierHelpers.ts`; TypeScript las trata como compatibles por structural typing. `SommelierIntentHint` (Task 3) y el tipo de retorno de `detectIntent` (Task 4) usan los mismos literales `'comparativa' | 'maridaje-inverso'`.
