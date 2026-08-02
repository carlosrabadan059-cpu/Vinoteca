# Diseño — Fase 11 (parte 1): Consolidar deuda técnica de sincronización y chat

## Contexto

Fase 11 del roadmap (`docs/roadmap/fase-11-optimizacion.md`) cubre 5 subsistemas independientes (rendimiento, offline+sync, accesibilidad, animaciones, pruebas OCR) más 3 ítems de deuda técnica ya identificados. Por su tamaño, se decidió descomponer la fase en sub-proyectos independientes en vez de diseñarla de una vez. Este es el primero: los 3 ítems de deuda técnica.

Investigación durante el brainstorming reveló que uno de los tres ítems ya estaba resuelto:

- **API key de OpenAI expuesta en cliente**: ya no existe. `src/lib/openai.ts` se eliminó en el commit `011a94b` ("eliminar dependencia openai — todas las llamadas IA van por n8n"). `TastingChat.tsx` ya llama a `callSommelierChat` (n8n) igual que el resto de features de IA. La nota del roadmap estaba desactualizada — se corrige como parte de este trabajo, sin ninguna acción de código.

Quedan dos ítems reales:

1. **`ChatBubble` duplicado** (`src/components/ui/ChatBubble.tsx` vs `src/components/wine/ChatBubble.tsx`) — resultó ser más simple de lo esperado: `src/components/wine/ChatBubble.tsx` no lo importa nadie (verificado con grep sobre todo `src/`). Es código muerto, no una duplicación activa entre dos consumidores.
2. **`processOperation` duplicado** (`src/main.tsx` vs `src/hooks/useSync.ts`) — duplicación real y activa: ambos archivos tienen una copia casi idéntica de `processOperation` (aplica una `SyncOperation` contra Supabase) y de la lógica de vaciar la cola de sincronización (`syncQueue`/`syncToSupabase`), con reintentos idénticos (máx. 2, luego se descarta).

## Alcance

### 1. Eliminar `src/components/wine/ChatBubble.tsx`

Archivo sin usar, se borra sin más. `src/components/ui/ChatBubble.tsx` (la versión con soporte de markdown, usada hoy por `src/pages/Sommelier.tsx`) no se toca.

### 2. Extraer la lógica de cola de sincronización a `src/lib/syncQueue.ts`

Nuevo archivo con:

```ts
export async function processOperation(op: SyncOperation): Promise<void>
export async function syncQueue(): Promise<void>
```

`processOperation` es exactamente la función ya existente (idéntica en ambos sitios hoy, sin cambios de comportamiento). `syncQueue` es la lógica ya existente en `main.tsx` (nombrada así ahí; en `useSync.ts` se llama `syncToSupabase`) — se adopta el nombre y la firma de `main.tsx` porque es la versión que ya vive fuera de React y no depende de ningún hook: lee la cola vía `getQueue()`, actualiza `useSyncStore` directamente (`setIsSyncing`/`setPending`/`setLastSync`), y no requiere ningún argumento.

`src/main.tsx` pasa a importar `syncQueue` desde `src/lib/syncQueue.ts` en vez de definirla localmente; los listeners `online`/`offline` no cambian de comportamiento.

`src/hooks/useSync.ts` pasa a ser un wrapper fino:

```ts
import { syncQueue } from '../lib/syncQueue'

export function useSync() {
  return { syncToSupabase: syncQueue }
}
```

Se mantiene el nombre `syncToSupabase` en la API pública del hook (no se renombra en los sitios que ya lo consuman, si los hay) para no forzar cambios adicionales fuera de este archivo — es solo un alias sobre la función compartida.

Nota: la única diferencia de comportamiento entre las dos copias actuales es un `console.error('Sync failed after 3 retries, dropping:', op)` que existe en `useSync.ts` pero no en `main.tsx`. Se conserva ese log en la versión consolidada (mejora menor, no pérdida de comportamiento).

### 3. Corregir la nota de `docs/roadmap/fase-11-optimizacion.md`

Eliminar el ítem "TastingChat hace llamada directa a OpenAI..." de la sección "Decisiones técnicas" (ya resuelto, no aplica) y marcar los otros dos como completados una vez implementados.

## Fuera de alcance

- Los otros 4 subsistemas de la Fase 11 (rendimiento, offline+sync *funcional* — activar el flujo, no solo consolidar el código —, accesibilidad, animaciones, pruebas OCR masivas): quedan como sub-proyectos futuros, cada uno con su propio ciclo brainstorming→plan→implementación cuando se aborden.
- No se activa ningún flujo de sincronización nuevo — `useSync.ts` sigue sin usarse desde ningún componente hoy; este trabajo es puramente de consolidación de código existente, no de funcionalidad nueva.
- No se toca `src/components/ui/ChatBubble.tsx` ni su lógica de markdown.

## Verificación

- `npx tsc -b`.
- Confirmar (`grep`) que ningún archivo importa ya `src/components/wine/ChatBubble.tsx` antes de borrarlo.
- Prueba manual: recargar la app, confirmar que el chat del Sommelier (`/sommelier`) sigue funcionando igual (usa `ui/ChatBubble`, no debería verse afectado). Simular una operación offline→online (DevTools → Network → Offline, añadir un vino, volver a Online) y confirmar que se sincroniza igual que antes.
