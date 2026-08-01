# Diseño — Fase 10: Sommelier IA

## Contexto

Fase 10 del roadmap (`docs/roadmap/fase-10-sommelier-ia.md`) está ⬜ Pendiente. El Sommelier ya funciona hoy vía tres workflows n8n activos (`vinoteca-sommelier-chat`, `vinoteca-sommelier-maridaje`, `vinoteca-sommelier-enriquecimiento`), enrutados desde `src/pages/Sommelier.tsx` con una función `detectIntent()` que distingue `maridaje` / `enriquecimiento` / `chat` por palabras clave, y envía la colección de vinos del usuario (`WineCollection[]`, hasta 50 vinos) como contexto en cada llamada.

Lo que falta, según el alcance ya definido en el roadmap:

1. Recomendaciones personalizadas basadas en el historial de catas del usuario.
2. Búsqueda por ocasión ("vino para cena romántica").
3. Comparativas entre vinos de la colección.
4. Contexto de catas del usuario en todas las respuestas del Sommelier.
5. Maridajes inversos (dado un vino, qué platos recomienda).

Fase 8 (Catas) ya está completa — el prerrequisito que el propio roadmap marcaba para esta fase ya no bloquea el trabajo.

## Alcance de esta fase

Se abordan las 5 capacidades. El cambio de fondo es único: construir un **perfil de gusto resumido** (`tasteProfile`) a partir del historial de catas del usuario y enviarlo en cada llamada al Sommelier junto con la colección de vinos ya existente. Las capacidades 1 y 4 son ese mismo cambio. Las capacidades 2, 3 y 5 se resuelven ampliando el router de intención (`detectIntent()`) ya existente en el frontend para reconocer patrones nuevos, reutilizando los tres workflows n8n existentes — no se crean workflows nuevos.

### Perfil de gusto (`tasteProfile`)

Nuevo archivo `src/lib/sommelierHelpers.ts`, siguiendo el mismo patrón de helpers puros que `statsHelpers.ts` (Fase 9) y `catasHelpers.ts` (Fase 8). Función `buildTasteProfile(wines: Wine[], tastings: Tasting[]): TasteProfile`:

```ts
export interface TasteProfile {
  vinosMejorValorados: { nombre: string; puntuacion: number }[] // top 5 por puntuación de cata, desc
  tipoPreferido: string | null       // tipo (wines.tipo) con puntuación media más alta, mín. 2 catas de ese tipo
  regionesPreferidas: string[]       // top 3 regiones (wines.region) por puntuación media, mín. 1 cata
  puntuacionMediaGeneral: number | null
  ocasionesFrecuentes: string[]      // top 3 valores de tastings.ocasion más repetidos (ocasion no nula/vacía)
}
```

Reglas de cálculo:
- El cruce cata↔vino se hace vía `tastings[].wine_id` contra `wines[].id` (mismo patrón de join que ya usa `useStats.ts`/`statsHelpers.ts`).
- Si `tastings.length === 0`, `buildTasteProfile` devuelve `{ vinosMejorValorados: [], tipoPreferido: null, regionesPreferidas: [], puntuacionMediaGeneral: null, ocasionesFrecuentes: [] }` — un perfil vacío, no un error. El Sommelier sigue funcionando exactamente igual que hoy cuando no hay catas.
- Catas sin `puntuacion` (null) se excluyen de los cálculos de puntuación media pero no rompen el cálculo (mismo criterio de exclusión ya usado en `computeValorEstimado` de Fase 9 para vinos sin precio).
- Sin parseo de blends ni de campos compuestos — mismo criterio YAGNI ya establecido en Fase 9 para `uva`.

`src/hooks/useSommelier.ts` (nuevo, pequeño) orquesta: cargar `wines`+`tastings` del usuario y llamar a `buildTasteProfile`. `Sommelier.tsx` consume este hook en vez de calcular nada él mismo.

### Ampliación de `detectIntent()`

`Sommelier.tsx` amplía el tipo de intención y las listas de palabras clave:

```ts
type Intent = 'maridaje' | 'comparativa' | 'maridaje-inverso' | 'enriquecimiento' | 'chat'

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
```

Orden de comprobación en `detectIntent(text)`: `comparativa` → `maridaje-inverso` → `maridaje` (ya existía) → `enriquecimiento` (ya existía) → `chat` (por defecto). Este orden es intencional: frases como "qué como con el Malleolus" solaparían con las keywords genéricas de `maridaje` (que incluye `"con "`) si no se comprueban antes las intenciones más específicas.

Comportamiento por intención en `sendMessage()`:

- **`comparativa`** y **`maridaje-inverso`**: usan `callSommelierChat` (no `callMaridaje`, porque no giran sobre un plato sino sobre razonamiento libre con la colección). El texto del usuario ya contiene los nombres de los vinos en lenguaje natural (p. ej. "compara el Malleolus con el Roble") — no se resuelven en el cliente; el prompt de n8n instruye a la IA a identificarlos dentro de `wineCollection`, que ya viaja en el payload. Se añade un campo `intentHint: 'comparativa' | 'maridaje-inverso' | undefined` al payload para que el prompt de n8n pueda dar una instrucción de formato específica (ver sección "Cambios en n8n").
- **`maridaje`** (ya existente): sin cambios de lógica de detección. Gana `tasteProfile` en el payload.
- **Búsqueda por ocasión**: no es una intención nueva — reutiliza `maridaje`. Si el texto matchea `OCASION_KEYWORDS` pero `extractPlato()` no encuentra un plato reconocible, se llama `callMaridaje('', wineCollection, ocasionDetectada, tasteProfile)` (el parámetro `ocasion` de `callMaridaje` ya existe en `src/lib/n8n.ts` pero no se usaba desde el frontend hasta ahora).
- **`enriquecimiento`** (ya existente): sin cambios de lógica de detección. No recibe `tasteProfile` (no depende del usuario).
- **`chat`** (por defecto): gana `tasteProfile` en el payload.

### Cambios en `src/lib/n8n.ts`

```ts
export interface TasteProfile {
  vinosMejorValorados: { nombre: string; puntuacion: number }[]
  tipoPreferido: string | null
  regionesPreferidas: string[]
  puntuacionMediaGeneral: number | null
  ocasionesFrecuentes: string[]
}

export async function callSommelierChat(
  messages: ChatMessage[],
  wineCollection: WineCollection[],
  userMessage: string,
  tasteProfile?: TasteProfile,
  intentHint?: 'comparativa' | 'maridaje-inverso',
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
  tasteProfile?: TasteProfile,
): Promise<{ recomendacion: string; wineId?: string }> {
  return post<{ recomendacion: string; wineId?: string }>('vinoteca/sommelier/maridaje', {
    plato,
    wineCollection,
    ocasion,
    tasteProfile,
  })
}
```

`callEnriquecimiento` no cambia.

### Cambios en los workflows n8n existentes

Se editan directamente vía MCP de n8n (igual que se hizo esta misma sesión para corregir `vinoteca-stats-insight` y `vinoteca-sommelier-maridaje`), no se crean workflows nuevos:

- **`vinoteca-sommelier-chat`**: el nodo `Normalize Input` gana dos campos (`tasteProfile`, `intentHint`) con el mismo patrón `??` de fallback que los campos existentes. El nodo `Sommelier AI` gana en su prompt un bloque `Perfil de gusto del usuario: {{ JSON.stringify($json.tasteProfile) }}` y una línea condicional: si `intentHint` es `'comparativa'`, añade "Estructura la comparación por aspectos: cuerpo, taninos, maridaje, ocasión ideal."; si es `'maridaje-inverso'`, añade "Sugiere 2-3 platos concretos, no una única sugerencia genérica."
- **`vinoteca-sommelier-maridaje`**: el nodo `Normalize Input` gana `tasteProfile`. El nodo `Maridaje AI` gana el mismo bloque de perfil de gusto en el prompt, y la línea `Recomienda el mejor vino de SU colección para maridar con "{{ plato }}"...` se vuelve condicional: si `plato` está vacío y `ocasion` no, cambia a `Recomienda el mejor vino de SU colección para una {{ ocasion }}.` (evita la construcción incorrecta `maridar con ""`).
- **`vinoteca-sommelier-enriquecimiento`**: sin cambios.

**Nota de esta sesión (ya aplicada, no parte del plan de implementación):** durante el brainstorming se detectó que `vinoteca-sommelier-maridaje` tenía el nodo `Maridaje AI` conectado al modelo gratuito de OpenRouter (`google/gemma-4-26b-a4b-it:free`) en vez del nodo `OpenAI gpt-4o Maridaje` de pago ya presente pero desconectado — el mismo problema de rate-limit ya corregido en `vinoteca-stats-insight` durante la verificación de Fase 9. Se corrigió reconectando el nodo existente y publicando la nueva versión; verificado con una ejecución manual exitosa (execution `475678`).

## Fuera de alcance

- UI dedicada para comparar vinos o para "maridaje inverso" desde `WineDetail.tsx` — todo se dispara por lenguaje natural en el chat existente, sin pantallas ni botones nuevos.
- Resolución de nombres de vino en el cliente (fuzzy matching) para comparativas/maridaje inverso — se delega enteramente al modelo, que ya recibe `wineCollection` completa.
- Cambios en `vinoteca-sommelier-enriquecimiento`.
- Historial de conversación persistente entre sesiones (hoy `messages` vive solo en memoria del componente, `slice(-20)`) — no se toca.
- Cambios de modelo/costes salvo el fix puntual de `vinoteca-sommelier-maridaje` ya aplicado.

## Verificación

- `npx tsc -b`.
- Prueba manual en `/sommelier` con una cuenta con catas variadas (distintos tipos, regiones, puntuaciones, ocasiones), probando las 5 capacidades: pregunta general con contexto de catas, maridaje por plato, búsqueda por ocasión, comparativa entre dos vinos de la colección, maridaje inverso.
- Prueba con una cuenta sin catas — confirmar que el Sommelier responde igual que hoy (perfil de gusto vacío no rompe nada).
- Ejecución manual de los dos workflows n8n modificados vía MCP (`execute_workflow` + `get_execution`) antes de dar cada tarea por cerrada, verificando que la respuesta JSON tiene la forma esperada y no hay errores de rate-limit u otros.
