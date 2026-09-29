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
| ✅ Fase 12 | Cuaderno de catas — V3 (2026-09-28) | [fase-12-cuaderno-catas.md](roadmap/fase-12-cuaderno-catas.md) |
| ✅ Fase 13 | Tutor de cata y glosario — V3.1 (2026-09-28) | [fase-13-tutor-cata.md](roadmap/fase-13-tutor-cata.md) |

---

## Pendientes

*(Ninguna fase numerada pendiente.)* Estado a 2026-09-28: la V3 (cuaderno) y la V3.1 (tutor y glosario) están en producción en Dokploy (`dd04f31`).

### Cabos sueltos

Por prioridad. Ninguno bloquea el uso de la app.

| # | Tarea | Por qué | Quién |
|---|-------|---------|-------|
| 1 | ~~Confirmar `SITE_URL` y `ADDITIONAL_REDIRECT_URLS` en el `.env` de Supabase~~ ✅ 2026-09-29 | Comprobado que `.env` y el contenedor `supabase-auth` (`GOTRUE_SITE_URL`, `GOTRUE_URI_ALLOW_LIST`) apuntan a `https://vinoteca.rabadanhouse.space` y `/restablecer`. Probado el envío real (2026-09-29): falla con `534 5.7.9 Application-specific password required` hasta poner en `SMTP_PASS` una contraseña de aplicación de Google. Los correos de recuperación, confirmación de registro y cambio de email usan las plantillas HTML de [`public/email/`](../public/email/) (`recuperar.html`, `confirmar.html`, `cambiar-email.html`), servidas por la app y cargadas por GoTrue con `GOTRUE_MAILER_TEMPLATES_{RECOVERY,CONFIRMATION,EMAIL_CHANGE}` y `GOTRUE_MAILER_SUBJECTS_*`, añadidas en el servicio `auth` de `/srv/docker/supabase/docker-compose.yml` en `debian`. Tras cambiar el compose o el `.env`, hay que ejecutar `docker compose up -d auth` (`restart` no relee la configuración) | — |
| 2 | ~~Avisos de seguridad de Supabase~~ ✅ 2026-09-28 | Revocado `EXECUTE` de `handle_new_user()` y `protect_profile_role_plan()` a `anon`/`authenticated` y `pg_trgm` movido al esquema `extensions` (migración `20260928140000_hardening_advisors.sql`). El linter ya no da avisos | — |
| 3 | ~~Hacer Omniroute resistente a cortes de luz~~ ✅ 2026-09-29 | Antes hacía `apt-get` y `npm install -g omniroute` en cada arranque; un corte a medias (`ENOTEMPTY`) lo dejó caído. Ahora el stack 43 de Portainer en `madrid` usa la imagen local `omniroute:3.8.50` (Dockerfile en `~/omniroute-image/` de `madrid`) con `pull_policy: never`; no instala nada al arrancar. Volumen `omniroute_data` intacto; desde n8n responde (401 sin clave, como debe). Para subir de versión: cambiar la versión en ese Dockerfile, `docker build -t omniroute:X.Y.Z .` y actualizar el tag en el stack | — |
| 4 | ~~Storage: fotos sin enlazar~~ ✅ 2026-09-29 | Resultó que los binarios estaban en el servidor sin la subcarpeta de versión. Carlos las revisó en una galería y decidió conservar solo las fotos en uso. ✅ Borradas de BD las 25 filas y las 2 de avatares (2026-09-28). ✅ Borrados también del servidor los 25 archivos sueltos y la versión vieja de la frontal de `05f068e1` (2026-09-28). ✅ Subida desde «Cambiar foto» la foto de estudio de El Castro de Valtuille 2025 (comprobada en Storage). ✅ `image_processing_state` de ese vino puesto en `done` (2026-09-29), tras confirmar Carlos que estaba terminado | — |
| 5 | ~~Archivar `Vinoteca – Scan Identificar`~~ ✅ 2026-09-28 | Archivado en n8n y eliminado `callScanIdentificar` de `src/lib/n8n.ts` | — |
| 6 | ~~Trigger `on_auth_user_created` en `auth.users`~~ ✅ 2026-09-29 | Recreado (migración `20260929100000_recreate_on_auth_user_created.sql`). Se perdió en la migración a self-hosted porque el esquema `auth` no se migra con `supabase/migrations`. Probado con un usuario de prueba en una transacción revertida: creó su fila en `profiles` y `user_settings`; siguen 2 usuarios, 2 perfiles y 2 ajustes | — |
| 7 | Revisar en uso real la calidad de `gpt-4o-mini` en el tutor | A veces atribuye una frase a la fuente equivocada o dice que algo «coincide» cuando el usuario no lo mencionó ([fase-13](roadmap/fase-13-tutor-cata.md)) | Carlos, usándolo |

**Comando ejecutado para el punto 4** (en `debian`, 2026-09-28; se conserva como referencia). Borra solo los `original.jpg` y `studio-*.png` que son archivos sueltos (las fotos válidas están dentro de su carpeta de versión) y la versión antigua suelta de la frontal de `05f068e1`:

```bash
cd /srv/docker/supabase/volumes/storage/wine-labels/d2bae57d-a469-44a9-8921-ddd3d6e1436b
find . -maxdepth 2 -type f \( -name 'original.jpg' -o -name 'studio-*.png' \) -print -delete
rm -v 05f068e1-1232-4446-8a51-bdf1544c84e5/frontal.jpg/490b31fc-f3ec-4361-9911-71ed9589a14e
```

### Mejoras opcionales

- **Cuaderno:** captura de una foto propia de la cata (`tastings.foto_url` ya existe; ahora la página usa la foto del vino). Lista de deseos, exportar a PDF, glosario y tabla de añadas ([fase-12](roadmap/fase-12-cuaderno-catas.md)).
- **Tutor:** añadir términos a mano al glosario (la categoría `general` ya existe); guardar la corrección junto a la cata; mostrar el texto a medida que se genera (streaming).
- **Otros vinos con 0 botellas:** Torre De Oña, Servilio Crianza y Nauda se quedan en la bodega como historial (decidido por Carlos); Moses nº 5 y Habla Nº34 y Nº36 se pasaron a vinos de fuera.
- Los avisos de lint anteriores a la V3 siguen ahí; los archivos nuevos están limpios.

Ideas documentadas, sin empezar:

| Fecha | Idea | Documento |
|-------|------|-----------|
| 2026-09-28 | RAG con el curso de sommelier (PDF → ¿Markdown? → pgvector) para el tutor, el glosario y el sommelier | [idea-rag-curso-sommelier.md](roadmap/idea-rag-curso-sommelier.md) |

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
