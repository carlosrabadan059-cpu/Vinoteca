# Almacenamiento offline — Vinoteca

Vinoteca usa tres capas de almacenamiento en el cliente: `localStorage` para datos pequeños y de sesión, **IndexedDB** para los datos de vinos y catas offline, y **Supabase Storage** para las imágenes.

## `localStorage` — wrapper tipado (`src/lib/storage.ts`)

```typescript
export const storage = {
  get<T>(key: string): T | null,
  set(key: string, value: unknown): void,
  remove(key: string): void,
}
```

Serializa y deserializa con `JSON.stringify` / `JSON.parse`. Es un helper genérico; el almacenamiento principal de vinos y catas usa IndexedDB, no este wrapper.

## IndexedDB — base de datos offline (`src/lib/idb.ts`)

**Nombre de la base de datos:** `vinoteca-offline`  
**Versión:** `1`  
**Librería:** [`idb`](https://github.com/jakearchibald/idb) v8 (wrapper tipado sobre la API IDB nativa)

### Esquema

```typescript
interface VinotecaDB {
  wines_local:    Wine           // keyPath: 'id'
  tastings_local: Tasting        // keyPath: 'id'
  sync_queue:     SyncOperation  // keyPath: 'id'
}
```

### Singleton `getDB()`

El acceso a la base de datos se gestiona mediante un singleton:

```typescript
let _db: IDBPDatabase<VinotecaDB> | null = null

async function getDB(): Promise<IDBPDatabase<VinotecaDB>>
```

La primera llamada abre y migra la base de datos; las llamadas siguientes devuelven la instancia en memoria.

### Operaciones disponibles

**Vinos locales (`wines_local`):**

| Función | Descripción |
|---------|-------------|
| `saveWineLocally(wine)` | `db.put('wines_local', wine)` — inserta o actualiza |
| `getLocalWines()` | `db.getAll('wines_local')` — devuelve todos |
| `removeLocalWine(id)` | `db.delete('wines_local', id)` |
| `clearLocalWines()` | `db.clear('wines_local')` |

**Catas locales (`tastings_local`):**

| Función | Descripción |
|---------|-------------|
| `saveTastingLocally(tasting)` | `db.put('tastings_local', tasting)` |
| `getLocalTastings()` | `db.getAll('tastings_local')` |
| `removeLocalTasting(id)` | `db.delete('tastings_local', id)` |

**Cola de sincronización (`sync_queue`):**

| Función | Descripción |
|---------|-------------|
| `addToQueue(op)` | Encola una `SyncOperation` |
| `getQueue()` | Devuelve todas las operaciones pendientes |
| `removeFromQueue(id)` | Elimina una operación completada |
| `updateQueueItem(id, retries)` | Incrementa el contador de reintentos |
| `getQueueCount()` | Número de operaciones pendientes |

## Patrón offline-first en `useWines`

### Carga inicial

```
loadWines()
  1. getLocalWines()  →  setWines(local)   ← respuesta inmediata al usuario
  2. if (!navigator.onLine) return         ← continúa offline si no hay red
  3. supabase.from('wines').select(...)
  4. merge: [pending_local, ...remote_sin_solapamiento]
  5. setWines(merged)
```

Los vinos con `synced_at = null` se consideran "pending local" y tienen prioridad en el merge.

### Escritura (createWine / updateWine / deleteWine)

```
acción del usuario
  │
  ├─► saveWineLocally(wine)       ← IDB, síncrono para la UI
  ├─► addWine(wine) en wineStore  ← Zustand, actualiza la lista
  │
  └─► try: supabase.from('wines').[insert|update|delete]
        ├─ Éxito:
        │    ├─ uploadWineImage() si hay imágenes
        │    ├─ update synced_at en IDB y Supabase
        │    └─ setPending(count)
        └─ Error (offline u otro):
             └─ addToQueue({ table: 'wines', action, data, retries: 0 })
```

## Cola de sincronización (`SyncOperation`)

```typescript
interface SyncOperation {
  id:         string                          // UUID
  table:      'wines' | 'tastings'
  action:     'insert' | 'update' | 'delete'
  data:       unknown
  created_at: string
  retries:    number                          // máx 3
}
```

## `useSync` — procesado de la cola

`syncToSupabase()` en `src/hooks/useSync.ts`:

1. Lee toda la `sync_queue` de IDB.
2. Para cada `SyncOperation`, llama a `processOperation(op)`:
   - `insert` → `supabase.from(table).insert(data)`
   - `update` → `supabase.from(table).update(data).eq('id', data.id)`
   - `delete` → `supabase.from(table).delete().eq('id', data.id)`
3. Éxito → `removeFromQueue(op.id)`
4. Error:
   - Si `op.retries >= 2` → descarta (log de error)
   - Si `op.retries < 2` → `updateQueueItem(op.id, retries + 1)`
5. Actualiza `syncStore`: `setPending(remaining)`, `setIsSyncing(false)`, `setLastSync(now)`

`processOperation` está duplicado entre `useSync.ts` y `src/main.tsx` (ver Roadmap).

## PWA Workbox — estrategias de caché

Configurado en `vite.config.ts`:

| Recurso | Estrategia | Cache name | TTL / Límite |
|---------|-----------|------------|-------------|
| `*.supabase.co/rest/v1/*` | **NetworkFirst** | `supabase-api` | timeout 5s, 24h, 100 entradas |
| `*.supabase.co/storage/v1/*` | **CacheFirst** | `supabase-storage` | 7 días, 200 entradas |
| Assets estáticos (js/css/html/png/svg/woff2) | **Precache** | (SW gestionado) | — |

**NetworkFirst para la API:** intenta la red primero; si no responde en 5s o hay error, sirve desde caché. Permite lecturas offline de datos recientes.

**CacheFirst para imágenes:** las fotos de etiquetas se sirven desde caché tras la primera descarga. Apropiado porque las URLs firmadas tienen validez de 10 años.
