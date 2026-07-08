# CHANGELOG

Todos los cambios funcionales importantes de Vinoteca se documentan aquí.
No es un volcado de commits — solo cambios relevantes para el producto.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/).
El versionado sigue [Semantic Versioning](https://semver.org/). El proyecto permanece en rama `0.x` hasta alcanzar estabilidad de producción.

---

## [Unreleased]

### Added

- Prototipo navegable de la Fase 7 (Gestión de bodega): grid 2 columnas, vista lista con agrupación, búsqueda con sugerencias, panel de filtros completo, indicadores de stock, estados vacíos y skeletons

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
