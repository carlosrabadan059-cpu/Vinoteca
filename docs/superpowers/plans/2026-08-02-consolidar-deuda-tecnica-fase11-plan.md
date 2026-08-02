# Consolidar deuda técnica (Fase 11, parte 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar dos duplicaciones de código reales (`ChatBubble` sin usar y `processOperation`/`syncQueue` copiado entre `main.tsx` y `useSync.ts`) y corregir una nota obsoleta del roadmap.

**Architecture:** `src/components/wine/ChatBubble.tsx` se borra por ser código muerto. La lógica de vaciar la cola de sincronización se extrae a un nuevo módulo `src/lib/syncQueue.ts`, del que `main.tsx` (listeners globales `online`/`offline`) y `useSync.ts` (hook para componentes) pasan a importar en vez de duplicar.

**Tech Stack:** TypeScript, React 19, Zustand, Supabase. Sin test runner configurado — verificación vía `npx tsc -b` + grep + prueba manual.

---

## Task 1: Eliminar `src/components/wine/ChatBubble.tsx` (código muerto)

**Files:**
- Delete: `src/components/wine/ChatBubble.tsx`

- [ ] **Step 1: Confirmar que no lo importa nadie**

Run: `grep -rn "components/wine/ChatBubble" src/`
Expected: sin resultados (ningún archivo lo importa). Si aparece algún resultado, DETENTE — no borres el archivo, informa BLOCKED con el resultado exacto, porque significaría que la spec está desactualizada.

- [ ] **Step 2: Borrar el archivo**

```bash
rm "src/components/wine/ChatBubble.tsx"
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores (ni salida)

IMPORTANTE: NO uses `npx tsc --noEmit` bajo ninguna circunstancia — en este repo es un no-op silencioso (el `tsconfig.json` raíz es "solution-style", con `"files": []`, solo `"references"`), sale con código 0 sin comprobar nada real. El único comando de verificación válido es `npx tsc -b`.

- [ ] **Step 4: Commit**

```bash
git add -A src/components/wine/ChatBubble.tsx
git commit -m "chore: eliminar ChatBubble sin usar en components/wine/"
```

---

## Task 2: Extraer `processOperation`/`syncQueue` a `src/lib/syncQueue.ts`

**Files:**
- Create: `src/lib/syncQueue.ts`
- Modify: `src/main.tsx`
- Modify: `src/hooks/useSync.ts`

Contexto de tipos ya existentes (no hace falta tocarlos, solo para referencia):

```ts
// src/types/index.ts
export interface SyncOperation {
  id: string
  table: 'wines' | 'tastings'
  action: 'insert' | 'update' | 'delete'
  data: unknown
  created_at: string
  retries: number
}
```

```ts
// src/store/syncStore.ts — useSyncStore expone:
// setPending(count: number), setIsSyncing(syncing: boolean), setLastSync(at: string), setIsOnline(online: boolean)
```

- [ ] **Step 1: Crear `src/lib/syncQueue.ts`**

```ts
// src/lib/syncQueue.ts
import { supabase } from './supabase'
import { getQueue, removeFromQueue, updateQueueItem, getQueueCount } from './idb'
import { useSyncStore } from '../store/syncStore'
import type { SyncOperation } from '../types'

export async function processOperation(op: SyncOperation): Promise<void> {
  const { table, action, data } = op
  const d = data as Record<string, unknown>
  if (action === 'insert') {
    const { error } = await supabase.from(table).insert(d)
    if (error) throw error
  } else if (action === 'update') {
    const { error } = await supabase.from(table).update(d).eq('id', d.id as string)
    if (error) throw error
  } else if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', d.id as string)
    if (error) throw error
  }
}

export async function syncQueue(): Promise<void> {
  const { setIsSyncing, setPending, setLastSync } = useSyncStore.getState()
  const queue = await getQueue()
  if (queue.length === 0) return

  setIsSyncing(true)
  for (const op of queue) {
    try {
      await processOperation(op)
      await removeFromQueue(op.id)
    } catch {
      if (op.retries >= 2) {
        await removeFromQueue(op.id)
        console.error('Sync failed after 3 retries, dropping:', op)
      } else {
        await updateQueueItem(op.id, op.retries + 1)
      }
    }
  }
  setPending(await getQueueCount())
  setIsSyncing(false)
  setLastSync(new Date().toISOString())
}
```

Nota: el `console.error('Sync failed after 3 retries, dropping:', op)` viene de la versión de `useSync.ts` (no estaba en la de `main.tsx`) — se conserva en la versión consolidada, es la única diferencia de comportamiento entre las dos copias actuales y no se pierde nada al fusionar.

- [ ] **Step 2: Simplificar `src/main.tsx` para usar el módulo nuevo**

Reemplazar el contenido actual completo de `src/main.tsx`:

```ts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useSyncStore } from './store/syncStore'
import { getQueue, removeFromQueue, updateQueueItem, getQueueCount } from './lib/idb'
import { supabase } from './lib/supabase'
import type { SyncOperation } from './types'

async function processOperation(op: SyncOperation): Promise<void> {
  const { table, action, data } = op
  const d = data as Record<string, unknown>
  if (action === 'insert') {
    const { error } = await supabase.from(table).insert(d)
    if (error) throw error
  } else if (action === 'update') {
    const { error } = await supabase.from(table).update(d).eq('id', d.id as string)
    if (error) throw error
  } else if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', d.id as string)
    if (error) throw error
  }
}

async function syncQueue(): Promise<void> {
  const { setIsSyncing, setPending, setLastSync } = useSyncStore.getState()
  const queue = await getQueue()
  if (queue.length === 0) return

  setIsSyncing(true)
  for (const op of queue) {
    try {
      await processOperation(op)
      await removeFromQueue(op.id)
    } catch {
      if (op.retries >= 2) {
        await removeFromQueue(op.id)
      } else {
        await updateQueueItem(op.id, op.retries + 1)
      }
    }
  }
  setPending(await getQueueCount())
  setIsSyncing(false)
  setLastSync(new Date().toISOString())
}

window.addEventListener('online',  () => { useSyncStore.getState().setIsOnline(true);  syncQueue().catch(console.error) })
window.addEventListener('offline', () => { useSyncStore.getState().setIsOnline(false) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

por:

```ts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useSyncStore } from './store/syncStore'
import { syncQueue } from './lib/syncQueue'

window.addEventListener('online',  () => { useSyncStore.getState().setIsOnline(true);  syncQueue().catch(console.error) })
window.addEventListener('offline', () => { useSyncStore.getState().setIsOnline(false) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Simplificar `src/hooks/useSync.ts` para usar el módulo nuevo**

Reemplazar el contenido actual completo de `src/hooks/useSync.ts`:

```ts
import { supabase } from '../lib/supabase'
import {
  getQueue,
  removeFromQueue,
  updateQueueItem,
  getQueueCount,
} from '../lib/idb'
import { useSyncStore } from '../store/syncStore'
import type { SyncOperation } from '../types'

export function useSync() {
  const { setPending, setIsSyncing, setLastSync } = useSyncStore()

  async function syncToSupabase(): Promise<void> {
    const queue = await getQueue()
    if (queue.length === 0) return

    setIsSyncing(true)

    for (const op of queue) {
      try {
        await processOperation(op)
        await removeFromQueue(op.id)
      } catch {
        if (op.retries >= 2) {
          await removeFromQueue(op.id)
          console.error('Sync failed after 3 retries, dropping:', op)
        } else {
          await updateQueueItem(op.id, op.retries + 1)
        }
      }
    }

    const remaining = await getQueueCount()
    setPending(remaining)
    setIsSyncing(false)
    setLastSync(new Date().toISOString())
  }

  return { syncToSupabase }
}

async function processOperation(op: SyncOperation): Promise<void> {
  const { table, action, data } = op
  const d = data as Record<string, unknown>

  if (action === 'insert') {
    const { error } = await supabase.from(table).insert(d)
    if (error) throw error
  } else if (action === 'update') {
    const { error } = await supabase.from(table).update(d).eq('id', d.id as string)
    if (error) throw error
  } else if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', d.id as string)
    if (error) throw error
  }
}
```

por:

```ts
import { syncQueue } from '../lib/syncQueue'

export function useSync() {
  return { syncToSupabase: syncQueue }
}
```

- [ ] **Step 4: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores. Si hay CUALQUIER error, detente e informa BLOCKED con el error exacto en vez de intentar arreglarlo por tu cuenta.

- [ ] **Step 5: Commit**

```bash
git add src/lib/syncQueue.ts src/main.tsx src/hooks/useSync.ts
git commit -m "refactor(sync): extraer processOperation/syncQueue a src/lib/syncQueue.ts"
```

---

## Task 3: Corregir `docs/roadmap/fase-11-optimizacion.md`

**Files:**
- Modify: `docs/roadmap/fase-11-optimizacion.md`

- [ ] **Step 1: Actualizar la sección "Decisiones técnicas"**

Reemplazar el bloque actual:

```md
## Decisiones técnicas

- `useSync.ts` y `idb.ts` existen — la estructura de sincronización offline está implementada pero no activada
- `processOperation` está duplicado en `useSync.ts` y `main.tsx` — pendiente de consolidar
- `ChatBubble` duplicado en `src/components/wine/` y `src/components/ui/` — pendiente de consolidar
- TastingChat hace llamada directa a OpenAI (expone API key en cliente) — pendiente de migrar a n8n
```

por:

```md
## Decisiones técnicas

- `useSync.ts` y `idb.ts` existen — la estructura de sincronización offline está implementada pero no activada desde ningún componente (nadie llama a `useSync().syncToSupabase()` todavía; el listener `online` de `main.tsx` sí sincroniza automáticamente)
- ✅ `processOperation`/`syncQueue` consolidados en `src/lib/syncQueue.ts` (2026-08-02) — `main.tsx` y `useSync.ts` ya no duplican la lógica
- ✅ `ChatBubble` de `src/components/wine/` era código muerto (nadie lo importaba) — eliminado (2026-08-02); la versión activa sigue en `src/components/ui/ChatBubble.tsx`
- ~~TastingChat hace llamada directa a OpenAI~~ — ya resuelto desde antes de esta fase (commit `011a94b`), `TastingChat.tsx` usa `callSommelierChat` (n8n) igual que el resto de features de IA. Nota eliminada por estar desactualizada.
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap/fase-11-optimizacion.md
git commit -m "docs: corregir estado de deuda técnica en Fase 11 (roadmap)"
```

---

## Self-Review (ya aplicado por el autor del plan)

**Cobertura del spec:**
- Eliminar `ChatBubble` sin usar → Task 1.
- Extraer `processOperation`/`syncQueue` a `src/lib/syncQueue.ts`, consolidando `main.tsx`/`useSync.ts` → Task 2.
- Conservar el `console.error` de `useSync.ts` → Task 2, Step 1 (documentado explícitamente en la nota).
- Corregir la nota del roadmap sobre TastingChat/OpenAI (ya resuelto) → Task 3.
- Marcar los dos ítems reales como completados en el roadmap → Task 3.

**Placeholder scan:** ninguno — cada step tiene código completo o comando exacto.

**Consistencia de tipos:** `syncQueue()` en `src/lib/syncQueue.ts` (Task 2) tiene la misma firma `(): Promise<void>` que se usa desde `main.tsx` (`syncQueue().catch(console.error)`) y desde `useSync.ts` (`syncToSupabase: syncQueue`, sin argumentos) — consistente en los tres sitios.
