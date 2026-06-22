# ADR 0003 — wine_uid como identificador canónico de vino

**Fecha:** 2026-06-23
**Estado:** Implementado

## Contexto

Necesitábamos una forma de identificar si un vino escaneado ya existe en la bodega del usuario sin depender de búsquedas textuales por nombre + bodega + añada, que son lentas, sensibles a mayúsculas y a tildes, y producen falsos negativos ante variaciones de escritura.

## Decisión

Se adopta `wine_uid`: un hash SHA-256 derivado de los tres campos canónicos del vino tras normalización:

```
wine_uid = SHA-256( normalizeWineText(nombre) | normalizeWineText(bodega) | añada_o_unknown-year )
```

`normalizeWineText` aplica: lowercase → NFD decompose → strip U+0300–U+036F → reemplazar `.,\-_/` por espacio → colapsar espacios → trim.

Vector de prueba canónico:
- Input: `"Habla La Tierra" | "Bodegas Habla" | 2024`
- Output: `8d0d78b51214f00ae5a3861a7acf3550638338f26bbe9aa01359436bb8993a5e`

El algoritmo es **idéntico** en el frontend (`src/lib/wineDuplicates.ts`) y en n8n (nodo Code del workflow `Vinoteca – Scan Identificar`). Cualquier modificación debe aplicarse en ambos lados de forma simultánea.

## Alternativas descartadas

- **UUID aleatorio:** No permite detectar duplicados. Cada escaneo crearía un vino nuevo aunque ya exista.
- **Hash solo del nombre:** Colisiones frecuentes entre vinos de diferentes bodegas con el mismo nombre (ej. "Reserva").

## Consecuencias

- La detección de duplicados es O(1): lookup de `wine_uid` en Supabase con índice.
- Los vinos creados antes de implementar `wine_uid` tienen `wine_uid = NULL`. Existe un script de backfill comentado en `src/lib/wineDuplicates.ts`.
- Sin añada conocida se usa la cadena literal `unknown-year` para mantener el hash determinista.
