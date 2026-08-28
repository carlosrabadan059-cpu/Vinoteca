# Descomponer "Vinoteca – Scan Analizar" en orquestador + sub-workflow

## Contexto

El workflow n8n **"Vinoteca – Scan Analizar"** (`NMQZ4zhYw3RjTcLp`, activo) recibe la foto de una etiqueta (frontal obligatoria, trasera opcional) y devuelve los datos del vino extraídos por GPT-4o Vision, más opcionalmente una "foto de estudio" (fondo profesional compuesto). Tras la limpieza de la rama de QR de hoy (ver `docs/CHANGELOG.md`, commit `96dc0d2`), el workflow bajó de 31 a 18 nodos, pero sigue mezclando en un solo lienzo tres flujos independientes que solo comparten trigger y respuesta final:

- **(A) Foto de estudio** — `02 Convertir Frontal → 03 Quitar Fondo → 04 Montar fondo premium`, llama a dos microservicios locales (`192.168.1.10:8090` y `:8088`).
- **(B) OCR de etiqueta** — `10 Preparar GPT → 11 Analizar Vision → 12 Parsear Vision → Es Vino? → Debug Datos Vino → Tiene Nombre` (GPT-4o Vision).
- **(C) Fusión y normalización** — `30 Fusionar Datos del Vino → Normalizar Datos`.

Durante las pruebas de hoy se confirmó un problema real de fiabilidad: `03 Quitar Fondo` devolvió un 500 del microservicio local, y al no tener ningún manejo de error, tumbó la ejecución completa — incluida la parte de OCR, que no depende en nada de la foto de estudio. Se verificó desactivando temporalmente los 3 nodos de la rama (A) que el resto del pipeline (OCR, fusión, respuesta) funciona perfectamente sin ellos.

Se detectaron además tres problemas menores de claridad/corrección durante el análisis:
- `Debug Datos Vino` (nodo Set) es vestigial — su output reshapeado nunca se lee downstream; `30 Fusionar Datos del Vino` ya reindexa `$('12 Parsear Vision')` directamente por nombre de nodo.
- `11 Analizar Vision` arrastra credenciales `httpHeaderAuth`/`httpCustomAuth` de Evolution-Api irrelevantes para una llamada a OpenAI (copy-paste de otro nodo).
- `Responder Sin nombre` devuelve `{{ $json.nombre }}` (una cadena suelta) en vez del objeto `ScanResult` completo — bug preexistente, nunca confirmado como intencional.

## Objetivo

Separar la rama (A) "Foto de estudio" en su propio sub-workflow, invocado desde el orquestador vía el patrón nativo de n8n `Execute Workflow` / `Execute Workflow Trigger` (confirmado como recomendado por `get_workflow_best_practices`, técnica `document_processing`). Esto resuelve el problema de fiabilidad real (un fallo del microservicio local ya no debe poder tumbar el OCR) y deja el lienzo del orquestador más legible, sin la indirección de separar (B) y (C), que siempre se ejecutan como una unidad secuencial.

## Alcance

**Dentro de alcance:**
- Extraer (A) a un sub-workflow nuevo, "Vinoteca – Scan · Foto de Estudio", con manejo de error explícito.
- Aplicar las tres limpiezas menores ya identificadas (eliminar `Debug Datos Vino`/`Tiene Nombre`/`Responder Sin nombre`, quitar credenciales huérfanas de `11 Analizar Vision`).
- Mantener (B) y (C) como una única cadena secuencial dentro del orquestador — no se convierten en sub-workflows separados.
- El contrato público del webhook (`ScanResult` en `src/lib/n8n.ts`) no cambia.

**Fuera de alcance (documentado, no se toca en este plan):**
- El 500 real de `03 Quitar Fondo` contra `192.168.1.10:8090` — issue de infraestructura de red local conocido, se investigará después. Este diseño solo evita que ese fallo tumbe el resto del escaneo.
- Posible duplicación funcional entre la rama "Foto de Estudio" (microservicios locales) y el workflow separado "Vinoteca – Wine Improve Photo" (`2vA9Ze6ARZ6EwlP6`, usa OpenAI `gpt-image-1`) — no se investiga aquí.
- Compartir lógica de fusión/normalización con "Vinoteca – Wine Enrich" — quedan independientes por ahora.
- Aplicar este mismo patrón orquestador a otros workflows del proyecto (p. ej. Wine Enrich) — decisión y plan separados si se decide hacerlo más adelante.
- `src/pages/Scan.tsx` y `src/components/ui/CameraView.tsx` — sin cambios de frontend en este trabajo.

## Diseño

### Arquitectura resultante

```
Vinoteca – Scan Analizar v2 (orquestador — workflow nuevo, paralelo al actual)
├─ 01 Recibir Imagen (webhook, sin cambios)
├─→ Execute Workflow: "Vinoteca – Scan · Foto de Estudio"   [rama paralela, tolerante a fallo]
└─→ 10 Preparar GPT → 11 Analizar Vision (limpio) → 12 Parsear Vision
        → Es Vino? ──false──→ Responder No Vino
                  └─true───→ 30 Fusionar Datos del Vino → Normalizar Datos
                                                              │
    ┌─────────────────────────────────────────────────────────┘
    ▼
Merge Final → 40 Extraer URL Imagen → Preparar Respuesta API → 41 Responder
```

### Sub-workflow nuevo: "Vinoteca – Scan · Foto de Estudio"

- **Trigger:** `Execute Workflow Trigger`.
- **Entrada:** el mismo payload crudo que hoy consume `02 Convertir Frontal` — `{ front: <base64>, back: <base64|null> }` — pasado tal cual desde `01 Recibir Imagen`, sin transformar.
- **Nodos:** `02 Convertir Frontal → 03 Quitar Fondo → 04 Montar fondo premium`, movidos tal cual desde el workflow actual.
- **Salida en éxito:** el mismo shape que produce hoy `04 Montar fondo premium` — objeto con `image` (URL/base64 de la foto de estudio compuesta). El último nodo ejecutado de un sub-workflow es su valor de retorno al `Execute Workflow` que lo invocó; no hace falta un nodo Respond explícito.
- **Manejo de error:**
  - `03 Quitar Fondo`: `onError: continueErrorOutput`. Su salida de error conecta directamente a un `Set` final que construye `{ image: null, error: "<mensaje del error>", error_source: "quitar_fondo" }` — se salta `04 Montar fondo premium` por completo (no tiene sentido componer un fondo premium sobre un fondo que no se pudo quitar).
  - `04 Montar fondo premium`: también `onError: continueErrorOutput`, por si falla el segundo microservicio (`:8088`) aunque el primero funcione. Su salida de error converge al mismo `Set`, con `error_source: "montar_fondo"`.
  - En ambos casos, al no tener campo `image`, el fallback que ya existe en `40 Extraer URL Imagen` del orquestador (`if ($json.image) ... else usar el front crudo`) se dispara automáticamente — no requiere ningún cambio en ese nodo.
  - `error`/`error_source` quedan visibles en el log de ejecución de n8n (útil para diagnosticar el 500 del microservicio cuando se investigue) pero **no se propagan a la respuesta pública del webhook** — `Preparar Respuesta API` construye la respuesta explícitamente campo a campo, no hace passthrough, así que el contrato `ScanResult` no cambia.

### Orquestador — limpiezas incluidas

- `11 Analizar Vision`: se quitan las credenciales huérfanas `httpHeaderAuth`/`httpCustomAuth`, queda solo `openAiApi`.
- Se eliminan `Debug Datos Vino`, `Tiene Nombre` y `Responder Sin nombre` los tres juntos, no solo se arregla el bug de `Responder Sin nombre`. Al no haber ninguna razón real para cortar el flujo cuando falta el nombre — nada se ahorra, ya que la rama de Foto de Estudio se dispara en paralelo de todas formas — la solución más simple y correcta es que `Es Vino?` (rama `true`) conecte **directamente** a `30 Fusionar Datos del Vino`, sin ningún IF de nombre intermedio. Si no hay nombre, sale `nombre: null` en la respuesta normal, igual que cualquier otro campo ausente — sin caso especial ni respuesta con forma distinta.

## Plan de migración

Mismo patrón ya usado hoy con el borrado de la rama de QR — backup, cambios en paralelo, corte solo al final:

1. **Backup**: snapshot JSON del workflow actual (18 nodos, `activeVersionId: 116faae3-3a63-40d5-b080-b51378beb5cc`) en `docs/n8n-backups/`, commit antes de tocar nada.
2. **Construir el sub-workflow nuevo** "Vinoteca – Scan · Foto de Estudio" como workflow n8n independiente, inactivo. Verificar de forma aislada con `execute_workflow` (modo manual) — caso éxito (foto real de La Chanin, ya usada hoy) y caso error (el 500 real de `03 Quitar Fondo`, que sigue reproducible ahora mismo, sirve como prueba real del camino de fallback sin necesidad de simular nada).
3. **Construir "Vinoteca – Scan Analizar v2"** — workflow nuevo y paralelo (no una edición in-place del original): copia de la estructura actual, con `02/03/04` sustituidos por el nodo `Execute Workflow` hacia el sub-workflow nuevo, más las limpiezas aprobadas aplicadas. Inactivo, sin tocar el webhook real todavía.
4. **Verificación en paralelo**: `execute_workflow` en modo manual contra v2, sin afectar el tráfico real (el workflow original sigue activo y sirviendo el webhook durante todo este paso). Casos a cubrir: escaneo normal con foto de estudio exitosa, escaneo con el microservicio caído (fallback), escaneo sin nombre reconocible (verifica que ya no exista el caso especial roto), escaneo con "no es vino".
5. **Corte**: activar v2 en el mismo path de webhook, desactivar/archivar el original (renombrado a "Vinoteca – Scan Analizar Previo", mismo patrón ya usado en este proyecto para versiones archivadas), documentar en `docs/CHANGELOG.md` con el mismo nivel de detalle que la limpieza de QR.

## Testing

Sin test runner (es infraestructura n8n) — verificación vía ejecuciones reales del MCP (`execute_workflow`/`get_workflow_execution`), igual que en la limpieza de QR de hoy:

- Sub-workflow aislado: caso éxito y caso error (microservicio caído), confirmando el shape de salida en ambos.
- Orquestador v2 completo: los cuatro casos listados en el paso 4 de migración, comparando la respuesta final contra la que produce hoy el workflow activo para los mismos inputs (mismo `ScanResult`, salvo el campo `nombre`/`imagen_url` cuando corresponda al fallback).
