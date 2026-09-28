# ADR 0008 — Cuaderno único y vinos de fuera con `wines.en_bodega`

**Fecha:** 2026-09-28
**Estado:** Implementado

## Contexto

V3 añade un cuaderno de catas (estilo Moleskine Wine Journal) para anotar también vinos bebidos fuera de casa que no están en la bodega. En el esquema existente `tastings.wine_id` es `NOT NULL` con FK a `wines` (`ON DELETE CASCADE`), y todo lo que hay en `wines` se trata como bodega: lista, contadores, estadísticas e inventario que se envía al Sommelier.

## Decisión

- **Un solo cuaderno** para todas las catas (de la bodega y de fuera), en vez de una sección aparte.
- **Los vinos de fuera viven en `wines` con `en_bodega = false`** (y `num_botellas = 0`), en vez de guardar los datos del vino dentro de la cata (`wine_id` nullable) o en una tabla `journal_wines` separada.
- "Lo he comprado" cambia la marca en la **misma fila** (`addToCellar`), sin copiar datos.
- En cliente, `isInCellar(w)` (`src/lib/cuadernoHelpers.ts`) trata `en_bodega` ausente como `true`, para los registros guardados en IndexedDB antes de V3.
- El chat IA de cata pasa a ser una ayuda opcional que prerrellena la ficha guiada.

## Alternativas descartadas

- **Datos del vino dentro de la cata**: duplica columnas y pasar el vino a la bodega implica copiarlo; se pierde la ficha, la foto y el enriquecimiento reutilizables.
- **Tabla `journal_wines`**: separación total, pero duplica la lógica de fotos, IA y ficha, y las catas tendrían que poder apuntar a dos tablas.

## Consecuencias

- Toda consulta de **inventario** debe filtrar `en_bodega`: `listWines`, las métricas de inventario de `useStats` y la colección del Sommelier. Las métricas de **cata** y el perfil de gusto siguen usando todos los vinos.
- Borrar un vino borra sus catas en cascada; por eso la ficha ofrece por defecto "quitar de la bodega (conservar catas)", que pone `en_bodega = false`.
- La detección de duplicados y el identify del escáner miran todos los vinos, de modo que escanear un vino ya anotado lo reutiliza en vez de duplicarlo.
- Los workflows n8n que consulten `wines` en servidor deben tener en cuenta la marca si calculan inventario.
