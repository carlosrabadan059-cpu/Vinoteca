# Fase 12 — Cuaderno de catas (V3)

## Estado

✅ Completada (2026-09-28): probada por Carlos y desplegada en producción junto con la [Fase 13](fase-13-tutor-cata.md).

---

## Objetivo

Un cuaderno de catas inspirado en el **Moleskine Wine Journal** donde anotar **todo lo que se bebe**, incluidos los vinos que no están en la bodega (restaurante, casa de amigos). Antes era imposible: toda cata apuntaba a un vino de `wines` y todo vino de `wines` contaba como bodega.

## Decisiones (tomadas con Carlos, 2026-09-27)

| Pregunta | Decisión |
|---|---|
| Encaje con las catas existentes | **Un solo cuaderno**: la pestaña Catas pasa a ser "Cuaderno" con catas de vinos de la bodega y de fuera. Cada página indica si el vino está en la bodega. |
| Cómo se rellena una página | **Ficha guiada tipo Moleskine**: cuándo/dónde/con quién/ocasión, Vista, Nariz, Boca (dulzor, acidez, tanino, cuerpo 1–5 + final), puntuación, maridaje, notas. El chat IA queda como **ayuda opcional** que prerrellena la ficha. El consumo rápido se mantiene. |
| Identificar un vino de fuera | **Foto + IA** con el escáner existente, pero el vino **no entra en la bodega**. "Lo he comprado" lo pasa después. |
| Dónde se guardan los vinos de fuera | **Misma tabla `wines`** con `en_bodega = false` — ver [ADR 0008](../adr/0008-cuaderno-unico-flag-en-bodega.md). |
| Extras V3 | **Índice por tipo** (pestañas Tinto/Blanco/Rosado/Espumoso/Dulce) + búsqueda y filtros por región y uva. Fuera de alcance: lista de deseos, exportar a PDF, glosario/tabla de añadas. |

## Modelo de datos

Migración [`20260927120000_cuaderno_catas.sql`](../../supabase/migrations/20260927120000_cuaderno_catas.sql):

- `wines.en_bodega boolean not null default true` + índice `(user_id, en_bodega)`.
- `tastings`: `dulzor`, `acidez`, `tanino`, `cuerpo` (smallint 1–5), `final` ('corto'|'medio'|'largo'), `con_quien`, `foto_url`. Todo nullable. Vista = `color_descripcion`, Nariz = `aroma` (ya existían). `puntuacion` sigue en 1–100 (slider 50–100).
- Vista `tastings_with_wine` recreada con las columnas nuevas y `wine_en_bodega` (mantiene `security_invoker`).

## Flujos

- **Nueva página** (`/catas/nueva`): "Vino de fuera" → `/scan?destino=cuaderno`, o elegir uno de la bodega/cuaderno (badge "De fuera"). Ficha guiada (`JournalSheetForm`) con botón "Ayúdame con la IA" (`TastingChat`, su resultado prerrellena la ficha). "Botella terminada" solo para vinos de la bodega.
- **Escáner en modo cuaderno**: mismo pipeline (analizar → identify → enrich). Si el vino ya existe se reutiliza; si no, se crea con `en_bodega=false, num_botellas=0` (`WineForm variant="cuaderno"` oculta los datos de colección) y se pasa a la ficha.
- **Escáner en modo bodega** sobre un vino del cuaderno: diálogo "Ya está en tu cuaderno — ¿añadir a bodega?" (`addToCellar`). `DuplicateWineDialog` ofrece "Pasar a mi bodega".
- **Ficha del vino** (`WineDetail`): aviso "No está en tu bodega" y botón "Lo he comprado" (botellas + precio). Borrar un vino de la bodega con catas ofrece por defecto **quitarlo de la bodega conservando las catas** (el FK de `tastings` es `ON DELETE CASCADE`).
- **Cuaderno** (`/catas`): pestañas de índice por tipo (`classifyWine`), buscador (vino, productor, lugar, con quién, notas) y filtros de región/uva, combinados con los filtros temporales existentes.
- **Página** (`/catas/:id`): foto de la etiqueta, estado bodega/fuera, contexto, Vista/Nariz/Boca con escalas, notas y maridaje.

## Impacto en otras pantallas

- **Bodega**: `listWines` filtra `en_bodega = true` (lista y contador "vinos").
- **Estadísticas**: inventario (vinos, botellas, valor, distribuciones) solo con la bodega; métricas de cata (total, media, mejor vino, evolución) con todo lo bebido.
- **Sommelier**: la colección que se envía a la IA solo incluye la bodega; el perfil de gusto (`buildTasteProfile`) usa todas las catas.
- **Cola offline** (`syncQueue`): se detiene en la primera operación fallida para no insertar una cata antes que su vino de fuera.

## Pendiente / fuera de alcance

- `tastings.foto_url` existe pero la ficha aún no captura una foto propia de la cata; la página usa la foto del vino.
- Workflows n8n revisados (2026-09-28): solo `Vinoteca – Wine Identify` lee `wines` en servidor y busca en **todos** los vinos (bodega y de fuera), que es lo deseado — el cliente relee el vino y decide según `en_bodega`. Sommelier (chat/maridaje) y stats-insight reciben la colección o las métricas ya filtradas desde el cliente. `Vinoteca – Scan Identificar` (`scan/identificar`) ya no se llama desde la app. Sin cambios necesarios en n8n.
- Lista de deseos, exportar a PDF, glosario y tabla de añadas.
