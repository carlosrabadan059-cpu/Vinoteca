# Fase 6 — Schema colección personal

## Estado

✅ Completada (commits `d3b69f0`, `4012ac6`)

---

## Objetivo

Añadir al modelo `Wine` los campos de colección personal que permiten al usuario gestionar su inventario físico de botellas.

---

## Alcance

- Migración de Supabase: 6 nuevas columnas en tabla `wines`
- Actualización de tipos TypeScript
- Integración en `useWines` para lectura y escritura

---

## Funcionalidades

### Nuevas columnas en `wines` (Supabase)

```sql
precio       NUMERIC        NULL
num_botellas INTEGER        DEFAULT 1
ubicacion    TEXT           NULL
fecha_compra DATE           NULL
favorito     BOOLEAN        DEFAULT FALSE
consumido    BOOLEAN        DEFAULT FALSE
```

### Tipo `Wine` actualizado (`src/types/index.ts`)

```typescript
precio:       number | null
num_botellas: number          -- default 1
ubicacion:    string | null
fecha_compra: string | null
favorito:     boolean
consumido:    boolean
```

---

## Decisiones de diseño

- `num_botellas` tiene default 1 (no 0) — un vino recién añadido asume al menos una botella
- `consumido` es un flag de estado, no sustituye al historial de consumo de catas
- `favorito` es un marcador personal del usuario, visible en la lista de bodega

---

## Decisiones técnicas

- Migración aplicada manualmente por el usuario vía Supabase SQL Editor
- `useWines` actualizado para incluir los 6 campos en queries SELECT y en los payloads de INSERT/UPDATE

---

## Pendiente

Ninguno. La fase está completa y los campos se usan en WineForm (Fase 4) y WineDetail (Fase 5).

---

## Criterio de finalización

✅ El usuario puede registrar cuántas botellas tiene, dónde están, cuánto pagó y marcar sus favoritos.
