# Fase 2 — Identificación (V1.4)

## Estado

✅ Completada · Pipeline congelado pendiente validación masiva

---

## Objetivo

Antes de llamar a GPT para análisis completo, identificar si el vino ya existe en la bodega del usuario usando `wine_uid`, evitando duplicados y llamadas innecesarias a GPT.

---

## Alcance

- Endpoint `wine/identify` en n8n
- Generación de `wine_uid` idéntica en frontend y n8n
- Lookup en Supabase por `wine_uid` y `qr_fuente`
- Integración en `Scan.tsx` como primera fase del pipeline

---

## Funcionalidades

- **callScanIdentificar** (`src/lib/n8n.ts`): `POST /webhook/vinoteca/wine/identify` con imagen frontal y `user_id`
- **wine_uid**: SHA-256 de `normalizeWineText(nombre)|normalizeWineText(bodega)|añada` — algoritmo idéntico en frontend (`src/lib/uuid.ts`) y en n8n
- **IdentifyResponse** (`src/types/index.ts`): respuesta tipada con `wine_uid`, `wine_id`, `identified_as`, `confidence`, `exists`, `normalizado`
- Si `exists: true` → navega directamente a la ficha del vino (sin GPT)
- Si `exists: false` → continúa al pipeline de análisis completo (`callScanAnalizar`)

---

## Decisiones de diseño

- Identidad y enriquecimiento son bloques separados, nunca se mezclan
- **Identidad** (`nombre`, `bodega`, `anada`, `region`, `denominacion`) procede solo de `/wine/identify → normalizado`
- **Enriquecimiento** (`uva`, `crianza`, `alcohol`, etc.) procede solo de `/wine/enrich → enriched`
- React nunca sobreescribe identidad con datos del enriquecimiento

---

## Decisiones técnicas

- Limitación conocida F1/F2: si OCR invierte nombre y bodega (p.ej. `nombre="Emilio Moro"`, `bodega="Malleolus"`), no se resuelve en V1.4. Se acepta y se documenta para futura resolución por contexto de BD
- Contratos de API congelados — cualquier cambio requiere bump de versión:
  - `POST /webhook/vinoteca/wine/identify` → `IdentifyResponse`
  - `POST /webhook/vinoteca/wine/enrich` → `EnrichResponse`

---

## Pendiente

- Validación masiva con etiquetas reales (pipeline congelado)
- Resolución del caso F1/F2 (nombre/bodega invertidos) — futura fase

---

## Criterio de finalización

✅ Si el vino ya existe en la bodega, el usuario llega a su ficha sin pasar por GPT.
