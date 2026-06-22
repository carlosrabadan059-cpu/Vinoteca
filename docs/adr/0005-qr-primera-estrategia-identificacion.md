# ADR 0005 — QR como primera estrategia de identificación

**Fecha:** 2026-06-24
**Estado:** Pendiente — V1.1

## Contexto

El flujo de identificación actual (Fase 1) busca por `wine_uid` derivado de OCR. OCR tiene una latencia inherente (llamada a GPT-4o Vision) y puede producir errores de lectura en etiquetas con tipografía difícil o mala iluminación.

Algunas botellas incluyen un código QR en la etiqueta que contiene un identificador único del vino. Detectar ese QR en el cliente es instantáneo y determinista.

## Decisión

El orden de identificación en Fase 1 es:

1. **QR** — detección en cliente (sin red). Si se encuentra `qr_fuente`, lookup directo en Supabase por `qr_fuente + user_id`.
2. **wine_uid** — si no hay QR o no se encuentra por QR: OCR → normalización → SHA-256 → lookup en Supabase.
3. **GPT completo (Fase 2)** — solo si ambas estrategias fallan (`found = false`).

El campo `qr_fuente` en la tabla `wines` almacena el valor escaneado del QR para futuras búsquedas.

## Consecuencias

- QR lookup es O(1) sin coste de tokens.
- Requiere integrar un lector de QR en el cliente antes de enviar la imagen a n8n.
- El workflow `Vinoteca – Scan Identificar` ya contempla el campo `qr_fuente` en el nodo de lookup de Supabase.
- Hasta que se implemente, el flujo de Fase 1 solo usa wine_uid.
