# Fase 4 — WineForm y backend Sommelier

## Estado

✅ Completada

---

## Objetivo

Rediseñar el formulario de edición del vino (WineForm) con secciones agrupadas, indicadores de confianza y campos de colección personal. Completar el backend del Sommelier con los tres workflows de n8n.

---

## Alcance

- Rediseño de `WineForm` con stepper de confianza y agrupación por secciones
- Campos de colección personal integrados en el modelo `Wine`
- Tres workflows Sommelier en n8n (chat libre, maridaje, enriquecimiento DO)
- Función `normalize()` para defaults cuando `initialData` no tiene campos nuevos

---

## Funcionalidades

### WineForm (`src/components/wine/WineForm.tsx`)
- Secciones: Identidad · Características · Descripción · Colección personal
- Stepper de confianza global: muestra el origen de cada campo (OCR / enrich / manual)
- `normalize()`: establece defaults para `precio`, `num_botellas`, `ubicacion`, `fecha_compra`, `favorito`, `consumido`
- Estado unificado `data: Partial<Wine>` — sin estados locales aislados por campo

### Backend Sommelier
- **Chat libre**: `POST /webhook/vinoteca/sommelier/chat` — historial + colección del usuario
- **Maridaje**: `POST /webhook/vinoteca/sommelier/maridaje` — plato + colección → recomendación con `wineId` opcional
- **Enriquecimiento DO**: `POST /webhook/vinoteca/sommelier/enriquecimiento` — denominación + región + uva → info narrativa
- `detectIntent()` en `Sommelier.tsx`: enrutamiento automático según palabras clave del mensaje

---

## Decisiones de diseño

- Colección personal visible en WineForm desde el primer guardado (no en pantalla separada)
- La colección de vinos enviada al Sommelier se limita a 50 vinos (`wines.slice(0, 50)`)

---

## Decisiones técnicas

- Tipo `WineCollection` (subconjunto de `Wine`) para las llamadas al Sommelier — evita enviar datos innecesarios
- Header Auth en todos los webhooks n8n: `Authorization: Bearer sk-...`
- Variables de entorno en Portainer: `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (service role, sin restricciones RLS)

---

## Pendiente

- Enviar resumen de catas al Sommelier para cruzar opiniones del usuario (pendiente Fase 8)

---

## Criterio de finalización

✅ El usuario puede editar el vino en secciones claras, ver la fuente de cada dato, y chatear con el Sommelier sobre maridaje y denominaciones.
