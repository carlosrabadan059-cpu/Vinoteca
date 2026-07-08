# Fase 1 — Captura y OCR

## Estado

✅ Completada

---

## Objetivo

Permitir al usuario fotografiar la etiqueta de un vino y extraer automáticamente sus datos mediante OCR con GPT-4o Vision.

---

## Alcance

- Captura de foto frontal y trasera desde la cámara del móvil
- Compresión y corrección de orientación EXIF
- Envío a n8n para análisis con GPT-4o Vision
- Extracción de campos del vino desde la etiqueta
- Subida de imágenes al bucket de Supabase Storage

---

## Funcionalidades

- **CameraView** (`src/components/ui/CameraView.tsx`): interfaz de cámara con preview, confirmación y botón "Girar" para iOS portrait invertido
- **useCamera** (`src/hooks/useCamera.ts`): acceso a `getUserMedia`, captura de frame, corrección EXIF, compresión JPEG
- **captureSource** (`src/lib/captureSource.ts`): `captureFrameFromVideo` con rama `angle === 180` para portrait invertido
- **callScanAnalizar** (`src/lib/n8n.ts`): envía `front` + `back` (nullable) al webhook n8n, timeout 60 s
- **Scan.tsx** (`src/pages/Scan.tsx`): pantalla principal del flujo de escaneo

---

## Decisiones de diseño

- Flujo en dos pasos: foto frontal obligatoria, trasera opcional
- Preview con confirmación antes de enviar (no auto-send)
- Botón "Girar" en lugar de detección automática de orientación (Safari no reporta 180° portrait)

---

## Decisiones técnicas

- GPT-4o Vision para OCR (mejor precisión que Tesseract para etiquetas de vino)
- Base64 sin prefijo `data:image/...` en las peticiones a n8n
- Compresión JPEG al 85% antes de enviar
- Sin ZXing / QR: eliminado en V1.3 porque los QR de etiquetas apuntan al portal AECOC, no a datos útiles
- Orientación 180°: `window.orientation` no funciona en iOS Safari para portrait invertido → solución: botón manual "Girar"

---

## Pendiente

- Validación masiva con colección real de etiquetas (pipeline congelado en V1.4)
- Animación de scan (overlay con línea animada) — prevista en Fase 11

---

## Criterio de finalización

✅ El usuario puede fotografiar una etiqueta de vino y los datos aparecen pre-rellenados en el formulario.
