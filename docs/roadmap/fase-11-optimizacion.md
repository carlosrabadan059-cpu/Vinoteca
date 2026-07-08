# Fase 11 — Optimización

## Estado

⬜ Pendiente

---

## Objetivo

Preparar Vinoteca para uso intensivo: rendimiento, modo offline completo, sincronización, accesibilidad y pruebas masivas del pipeline OCR.

---

## Alcance

- Rendimiento: virtualización de listas largas, caché de imágenes
- Offline completo: sync automático al reconectar (estructura IDB lista, flujo no activado)
- Accesibilidad: foco de teclado, roles ARIA, contraste
- Animaciones: transiciones de pantalla, micro-interacciones
- Pruebas masivas del pipeline OCR V1.4 con colección real de etiquetas

---

## Funcionalidades

*(Por definir)*

---

## Decisiones de diseño

*(Por definir)*

---

## Decisiones técnicas

- `useSync.ts` y `idb.ts` existen — la estructura de sincronización offline está implementada pero no activada
- `processOperation` está duplicado en `useSync.ts` y `main.tsx` — pendiente de consolidar
- `ChatBubble` duplicado en `src/components/wine/` y `src/components/ui/` — pendiente de consolidar
- TastingChat hace llamada directa a OpenAI (expone API key en cliente) — pendiente de migrar a n8n

---

## Pendiente

- Todo. Esta es la última fase y depende de que las anteriores estén estables.
- Validación masiva de OCR con etiquetas reales (desbloqueará el pipeline V1.4 congelado).

---

## Criterio de finalización

La app funciona fluida con 500+ vinos, opera en modo offline y el pipeline OCR ha sido validado con colección real.
