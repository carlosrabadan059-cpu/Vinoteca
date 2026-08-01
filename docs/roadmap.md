# Roadmap — Vinoteca

> Este documento es la referencia oficial del proyecto. Cada fase tiene su documento detallado en `docs/roadmap/`.
> Para retomar cualquier fase: lee su documento y tendrás todo el contexto necesario.

---

## Completadas

| Fase | Nombre | Documento |
|------|--------|-----------|
| ✅ Fase 1 | Captura y OCR | [fase-01-captura-ocr.md](roadmap/fase-01-captura-ocr.md) |
| ✅ Fase 2 | Identificación (V1.4) | [fase-02-identificacion.md](roadmap/fase-02-identificacion.md) |
| ✅ Fase 3 | Enriquecimiento | [fase-03-enriquecimiento.md](roadmap/fase-03-enriquecimiento.md) |
| ✅ Fase 4 | WineForm y backend Sommelier | [fase-04-wineform.md](roadmap/fase-04-wineform.md) |
| ✅ Fase 5 | Ficha del vino (WineDetail) | [fase-05-ficha-vino.md](roadmap/fase-05-ficha-vino.md) |
| ✅ Fase 6 | Schema colección personal | [fase-06-schema-coleccion.md](roadmap/fase-06-schema-coleccion.md) |
| ✅ Fase 7 | Gestión de la bodega (v0.7.0, 2026-07-09) | [fase-07-gestion-bodega.md](roadmap/fase-07-gestion-bodega.md) |
| ✅ Fase 8 | Catas (v0.8.0, 2026-07-09) | [fase-08-catas.md](roadmap/fase-08-catas.md) |
| ✅ Fase 9 | Estadísticas (2026-07-18) | [fase-09-estadisticas.md](roadmap/fase-09-estadisticas.md) |
| ✅ Fase 10 | Sommelier IA (2026-08-02) | [fase-10-sommelier-ia.md](roadmap/fase-10-sommelier-ia.md) |

---

## Pendientes

| Fase | Nombre | Documento |
|------|--------|-----------|
| ⬜ Fase 11 | Optimización | [fase-11-optimizacion.md](roadmap/fase-11-optimizacion.md) |

---

## Fuera de numeración

Trabajo realizado entre el cierre de la Fase 8 y el inicio de la Fase 9, sin ocupar un número de fase para no interferir con la numeración del roadmap:

| Fecha | Nombre | Documento |
|-------|--------|-----------|
| 2026-07-18 | Gestión de usuarios y cuentas (auth, perfil, ajustes, RLS) | [gestion-usuarios-cuentas.md](gestion-usuarios-cuentas.md), [auth-architecture.md](auth-architecture.md) |

---

## Congelado

| Pipeline | Estado | Motivo |
|----------|--------|--------|
| OCR V1.4 (identify + enrich) | ⏸️ Congelado | Pendiente validación con colección real de etiquetas |

No tocar: `Scan.tsx`, workflows n8n `wine/identify` y `wine/enrich`, tipos `IdentifyResponse`/`EnrichResponse`.

---

## Principios arquitectónicos

- **n8n** = lógica de negocio (OCR, identificación, enriquecimiento, Sommelier)
- **Supabase** = fuente de verdad (CRUD, auth, storage de imágenes)
- **GPT** solo si el vino no existe en la base de datos
- **`wine_uid`** debe ser idéntico en n8n y en el frontend (SHA-256 de `nombre|bodega|añada` normalizados)

Ver [decisions/README.md](decisions/README.md) para el registro de decisiones de diseño.
