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
| ✅ Fase 11 | Optimización (2026-08-19) | [fase-11-optimizacion.md](roadmap/fase-11-optimizacion.md) |

---

## Pendientes

*(Ninguna fase numerada pendiente — ver "Congelado" y los documentos de cada fase para cabos sueltos menores)*

---

## Fuera de numeración

Trabajo que no encaja en ninguna fase del roadmap, registrado sin ocupar un número de fase para no interferir con la numeración:

| Fecha | Nombre | Documento |
|-------|--------|-----------|
| 2026-07-18 | Gestión de usuarios y cuentas (auth, perfil, ajustes, RLS) | [gestion-usuarios-cuentas.md](gestion-usuarios-cuentas.md), [auth-architecture.md](auth-architecture.md) |
| 2026-08-02 | Mejoras de calidad de imagen en la captura de cámara (brillo, auto-niveles, aviso de borrosa) | [spec](superpowers/specs/2026-08-02-mejoras-camara-captura-design.md), [plan](superpowers/plans/2026-08-02-mejoras-camara-captura-plan.md) |
| 2026-08-03 | Reemplazar/añadir la foto de un vino ya guardado desde la ficha | [spec](superpowers/specs/2026-08-03-reemplazar-foto-vino-design.md), [plan](superpowers/plans/2026-08-03-reemplazar-foto-vino-plan.md) |
| 2026-08-03 | "Foto de estudio" — mejora de fotografías de vino con IA (OpenAI vía n8n) | [spec](superpowers/specs/2026-08-03-foto-estudio-ia-design.md), [plan](superpowers/plans/2026-08-03-foto-estudio-ia-plan.md) |

---

## Congelado

| Pipeline | Estado | Motivo |
|----------|--------|--------|
| OCR V1.4 (identify + enrich) | ✅ Validado informalmente (2026-08-19) | 28 vinos reales registrados sin incidencias en uso normal; no se montó la validación masiva estructurada, dada por buena con esta evidencia (ver [fase-11-optimizacion.md](roadmap/fase-11-optimizacion.md)) |

---

## Principios arquitectónicos

- **n8n** = lógica de negocio (OCR, identificación, enriquecimiento, Sommelier)
- **Supabase** = fuente de verdad (CRUD, auth, storage de imágenes)
- **GPT** solo si el vino no existe en la base de datos
- **`wine_uid`** debe ser idéntico en n8n y en el frontend (SHA-256 de `nombre|bodega|añada` normalizados)

Ver [decisions/README.md](decisions/README.md) para el registro de decisiones de diseño.
