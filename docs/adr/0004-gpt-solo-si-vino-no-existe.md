# ADR 0004 — GPT solo cuando el vino no existe

**Fecha:** 2026-06-24
**Estado:** Implementado

## Contexto

El análisis completo de etiquetas con GPT-4o Vision es la operación más lenta y cara del flujo de escaneo (10–20 segundos, coste de tokens por cada llamada). En muchos casos el usuario escanea un vino que ya tiene en su bodega.

## Decisión

GPT se invoca únicamente en la Fase 2 del scan, y solo si la Fase 1 no encontró el vino:

1. **Fase 1 — Identificar** (`POST /webhook/vinoteca/scan/identificar`): QR lookup → wine_uid lookup → Supabase. Sin llamada a GPT.
2. **Fase 2 — Analizar** (`POST /webhook/vinoteca/scan/analizar`): OCR + extracción de campos con GPT-4o Vision. Solo se ejecuta si `found = false` en Fase 1.

Si el vino ya existe, el flujo termina en Fase 1 y navega directamente al detalle del vino.

## Consecuencias

- Reducción de coste y tiempo en el caso más frecuente (vino ya en bodega).
- La lógica de guardia vive en n8n y en el frontend (`Scan.tsx`): ambos deben respetar esta regla.
- Nunca llamar a `callScanAnalizar` si `ScanIdentifyResponse.found === true`.
