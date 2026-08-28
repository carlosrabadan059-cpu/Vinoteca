# CHANGELOG

Todos los cambios funcionales importantes de Vinoteca se documentan aquí.
No es un volcado de commits — solo cambios relevantes para el producto.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/).
El versionado sigue [Semantic Versioning](https://semver.org/). El proyecto permanece en rama `0.x` hasta alcanzar estabilidad de producción.

---

## [Unreleased]

### Added

- Prototipo navegable de la Fase 7 (Gestión de bodega): grid 2 columnas, vista lista con agrupación, búsqueda con sugerencias, panel de filtros completo, indicadores de stock, estados vacíos y skeletons
- Icono de salir de la app en el header (`Layout.tsx`), con modal de confirmación antes de cerrar sesión

### Changed

- **Workflow n8n `Vinoteca – Scan Analizar` sustituido por `Vinoteca – Scan Analizar v2`**: descompuesto en un orquestador + un sub-workflow (`Vinoteca – Scan · Foto de Estudio`), siguiendo el patrón nativo de n8n Execute Workflow / Execute Workflow Trigger. La rama de "foto de estudio" (que llama a dos microservicios locales) queda aislada en su propio sub-workflow con manejo de errores explícito (`onError: continueErrorOutput`): un fallo en esa rama (p. ej. el microservicio local de eliminación de fondo) ya no tumba toda la ejecución del escaneo — degrada de forma controlada usando la foto subida en crudo en vez de la foto de estudio procesada. Esto fue un bug real encontrado y corregido durante las pruebas de hoy: un 500 real del microservicio en `192.168.1.10:8090` tumbaba antes toda la ejecución del escaneo. De paso se eliminaron tres nodos vestigiales/con bugs: un nodo Set de código muerto (`Debug Datos Vino`), un nodo IF ya sin sentido (`Tiene Nombre`) y un nodo de respuesta roto (`Responder Sin nombre`) que devolvía un string suelto en vez del objeto `ScanResult` completo — un bug latente que desaparece al no existir ya ese camino especial (un `nombre` ausente ahora simplemente fluye como `null`, igual que cualquier otro campo faltante, verificado con un caso de prueba real). El contrato `ScanResult` de cara al cliente (`src/lib/n8n.ts`) no cambia — es un refactor interno de n8n, sin cambios en el frontend. El workflow original se conserva (no se borra), renombrado a `Vinoteca – Scan Analizar Previo` y archivado, siguiendo el mismo patrón usado hoy para otras retiradas de workflows en este proyecto. Ver el diseño en [`docs/superpowers/specs/2026-08-28-scan-analizar-orquestador-design.md`](superpowers/specs/2026-08-28-scan-analizar-orquestador-design.md), el plan de implementación en [`docs/superpowers/plans/2026-08-28-scan-analizar-orquestador.md`](superpowers/plans/2026-08-28-scan-analizar-orquestador.md) y el backup previo al cambio en [`docs/n8n-backups/`](n8n-backups/README.md). Fuera de alcance: el 500 subyacente del microservicio local en `192.168.1.10:8090` sigue sin arreglar — este refactor solo evita que tumbe todo el escaneo, no corrige la causa raíz, que queda como incidencia aparte y documentada.

- **Investigada la posible duplicación entre la rama de "foto de estudio" y `Vinoteca – Wine Improve Photo`** (2026-08-28, tras el corte de arriba): confirmada. Son dos pipelines independientes para el mismo propósito (fondo de estudio homogéneo para la foto de la botella), con estilos visuales distintos y sin relación entre sí. La rama de "foto de estudio" (sub-workflow `Vinoteca – Scan · Foto de Estudio`) llama a dos microservicios Docker propios — `rmbg-service` (`192.168.1.10:8090/remove-background`, es el que da el 500 documentado arriba) y `vinoteca-image-service` (`192.168.1.10:8088/compose`, su estado real es desconocido porque nunca se llega a ejecutar mientras el primero falle) — y solo se dispara automáticamente al escanear un vino **nuevo** (`Scan.tsx` → `callScanAnalizar`). El workflow separado `Vinoteca – Wine Improve Photo` (`2vA9Ze6ARZ6EwlP6`) usa OpenAI `gpt-image-1` con un prompt fijo, y solo se dispara al cambiar la foto de un vino **existente** o desde el botón manual "Mejorar foto" (`WineDetail.tsx` → `callImprovePhoto`) — nunca se llama desde el alta de un vino nuevo. Un comentario en `src/pages/WineDetail.tsx:261-264` afirma que una foto nueva "pasa por el mismo procesado de estudio con IA" que el flujo de `WineDetail.tsx`; eso es incorrecto tal y como está implementado hoy, lo que sugiere que `Wine Improve Photo` se construyó (2026-08-03) para sustituir a los microservicios locales pero esa migración nunca se completó en `Scan.tsx`. **Decisión:** por ahora se mantienen `rmbg-service`/`vinoteca-image-service` como el mecanismo activo para altas nuevas — no están huérfanos, siguen en uso real. No se aplica ningún cambio de código ni consolidación en esta sesión; queda documentado como hallazgo pendiente de decidir más adelante.

### Fixed

- **App caída en producción tras migrar Supabase a self-hosted (2026-08-19)**: `VITE_SUPABASE_URL` en Vercel quedó vacío, y un cambio de red (rebind de Kong a Tailscale) tumbó silenciosamente el dominio público de la API (`supabase-api.rabadanhouse.space`, 502). De paso se encontró y corrigió un bug preexistente en `kong.yml`: los consumers no tenían grupo ACL asignado, así que ninguna API key habría funcionado contra el self-hosted aunque el resto estuviera bien configurado. Ver [`docs/supabase.md`](supabase.md) para el detalle de la infraestructura resultante.

### Removed

- **Rama de lectura de QR en el workflow n8n `Vinoteca – Scan Analizar`** (13 nodos: `20 Preparar Trasera` → `21 Tiene Trasera` → `Convierte Trasera` → `22 Leer QR` → `23 Tiene QR` → `24 Abrir URL QR` → `Preparar Datos QR` → `25 Analizar Datos QR` → `Parsear Datos QR` / `QR Vacio` → `Merge QR` → `Merge Datos`). El escáner de QR ya se había eliminado del cliente en V1.3 (`@zxing/browser` desinstalado — los QR de etiquetas de vino apuntan mayoritariamente al portal AECOC, no a datos útiles) pero la rama equivalente en el backend n8n nunca se limpió: seguía llamando a un microservicio local de decodificación de QR y a un segundo prompt de OpenAI en cada escaneo con foto trasera, sin que el frontend leyera nada de su resultado (`ScanResult` en `src/lib/n8n.ts` nunca declaró `has_qr`/`qr_fuente`/`certificaciones`/`maridaje`, y `Wine.qr_fuente` nunca se rellenaba desde `Scan.tsx`). La foto trasera en sí no se toca — sigue enviándose a GPT Vision como segunda imagen para OCR. `30 Fusionar Datos del Vino` se simplificó para leer solo de `12 Parsear Vision` (antes hacía fallback a los datos del QR, siempre vacíos en la práctica). Workflow reducido de 31 a 18 nodos. Verificado con una ejecución real (GPT-4o Vision incluido) contra una etiqueta real antes de publicar — sin errores, sin datos inventados. Publicado y activo en producción. Backup del JSON previo en [`docs/n8n-backups/`](n8n-backups/README.md).

---

## [0.6.0] — 2026-07-06

### Added

- **Ficha del vino rediseñada** (`WineDetail`): hero 238px con imagen de etiqueta, gradiente y datos de identidad
- **Acciones rápidas** en la ficha: Catar · Consumir · Editar
- **Bloque de características** técnicas (uva, crianza, alcohol, temperatura de servicio) — se oculta si está vacío
- **Bloque de información** (descripción + URL de bodega) — se oculta si está vacío
- **Últimas catas**: muestra las 3 más recientes con estrellas y estado vacío
- **Mi colección colapsable**: botellas, precio, ubicación, fecha de compra, favorito — cerrado por defecto
- **Menú ⋯**: acceso a web oficial de la bodega y opción de eliminar vino

### Changed

- Jerarquía visual de la ficha completamente rediseñada: primero la identidad del vino, después las acciones, después los datos técnicos
- El bloque de colección personal pasa a un panel colapsable (antes era una sección siempre visible)

### Fixed

- Navegación correcta a la ficha del vino recién creado tras guardar en el formulario

---

## [0.5.0] — 2026-07-05

### Added

- **Schema de colección personal**: 6 nuevas columnas en la tabla `wines` de Supabase (`precio`, `num_botellas`, `ubicacion`, `fecha_compra`, `favorito`, `consumido`)
- **WineForm rediseñado**: secciones agrupadas (Identidad · Características · Descripción · Colección personal)
- **Indicadores de confianza** en WineForm: cada campo muestra su origen (OCR / enriquecimiento / manual) y nivel de confianza (alto / medio / bajo)
- **Stepper de confianza global**: resumen visual de la calidad de los datos del vino

### Changed

- Estado de WineForm unificado en `data: Partial<Wine>` — eliminados estados locales aislados por campo
- La función `normalize()` establece defaults para los nuevos campos de colección cuando `initialData` no los tiene

---

## [0.4.0] — 2026-07-04

### Added

- **Pipeline V1.4 — Enriquecimiento**: endpoint `POST /webhook/vinoteca/wine/enrich` en n8n
- **FieldTrace**: trazabilidad por campo con fuente, URL, prioridad, fecha y nivel de confianza
- **SourceType**: jerarquía de fuentes (`official_winery` > `technical_sheet` > `do_oficial` > `distributor` > `vivino` > `other`)
- **Corrección de orientación 180°**: botón "Girar" en preview de cámara para portrait invertido en iOS (Safari no reporta 180° vía API)

### Changed

- Identidad y enriquecimiento son ahora bloques separados: el enriquecimiento nunca sobreescribe los campos de identidad del vino

### Removed

- **Escáner QR eliminado**: `@zxing/browser` desinstalado. Los QR en etiquetas de vino apuntan mayoritariamente al portal AECOC, no a datos útiles. El OCR de etiqueta cubre el caso de uso completamente.

---

## [0.3.0] — 2026-06-25

### Added

- **Pipeline V1.4 — Identificación**: endpoint `POST /webhook/vinoteca/wine/identify` en n8n
- **wine_uid**: identificador determinístico SHA-256 de `nombre|bodega|añada` normalizados — algoritmo idéntico en frontend (`src/lib/uuid.ts`) y en n8n
- Si el vino ya existe en la bodega del usuario, el pipeline navega directamente a su ficha sin llamar a GPT
- **IdentifyResponse**: tipo TypeScript con `wine_uid`, `wine_id`, `identified_as`, `confidence`, `exists`, `normalizado`

### Fixed

- Fix en el workflow n8n "Scan Analizar": dos nodos `Merge` con `combineByPosition` quedaban bloqueados cuando no había imagen trasera — corregidas las conexiones de los NoOp a los puertos correctos

---

## [0.2.0] — 2026-06-18

### Added

- **Pipeline OCR completo**: captura frontal + trasera opcionales → n8n → GPT-4o Vision → campos extraídos
- **Backend Sommelier** con tres endpoints n8n:
  - `sommelier/chat`: chat libre con contexto de la bodega del usuario
  - `sommelier/maridaje`: recomendación de maridaje con vino concreto de la colección
  - `sommelier/enriquecimiento`: información sobre denominaciones de origen
- **Enrutamiento de intención** (`detectIntent`) en `Sommelier.tsx`: activa el endpoint correcto según palabras clave
- **Historial de consumo** (`es_consumo_rapido`): nuevo tipo de entrada en `tastings` para registrar consumos rápidos sin cata completa
- **ConsumoQuickForm**: modal bottom sheet con fecha, ocasión, lugar y botella terminada
- **TastingMiniCard**: badge visual CATA / CONSUMO

### Changed

- `callScanAnalizar` envía `back: null` (no `undefined`) cuando no hay imagen trasera — compatibilidad con n8n

---

## [0.1.0] — 2026-06-10

### Added

- **Autenticación** con Supabase (email + contraseña)
- **Captura de foto** desde cámara del móvil con `CameraView` y `useCamera`
- **CRUD completo de vinos** en Supabase con imágenes en bucket `wine-labels`
- **IndexedDB offline** (`src/lib/idb.ts`) con cola de sync (`src/hooks/useSync.ts`)
- **Lista de bodega** (`Bodega.tsx`) con búsqueda por texto, filtros por tipo y scroll infinito (páginas de 20)
- **Catas**: formulario completo, puntuación con estrellas, notas libres, historial de chat con Sommelier
- **PWA instalable**: Service Worker con Workbox `NetworkFirst` para llamadas a Supabase, manifest con icono
- **Tema centralizado** (`src/constants/theme.ts`): colores, espaciado 4px, tipografías, border-radius
- **Routing** con React Router v7: `AuthLayout` (login/registro) y `TabsLayout` (bodega/añadir/catas/sommelier)
