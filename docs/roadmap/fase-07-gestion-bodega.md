# Fase 7 — Gestión de la bodega

## Estado

🚧 En desarrollo

---

## Objetivo

Convertir la pantalla Bodega en la pantalla principal de la aplicación. Debe permitir encontrar cualquier vino en pocos segundos incluso con cientos de referencias. Prioridad: buscar → filtrar → navegar → gestionar.

---

## Alcance

- Búsqueda instantánea con sugerencias (nombre, bodega, región, uva, DO)
- Filtros por tipo, colección (favoritos, stock, consumidos)
- Rango de añada
- Agrupación por bodega / DO / añada / tipo / ubicación
- Ordenación múltiple
- Dos modos de vista: grid (2 columnas) y lista compacta
- Indicadores de stock en tarjeta
- Panel de filtros completo (sheet)
- Estados vacíos diferenciados (sin resultados vs bodega vacía)
- Skeletons de carga

---

## Funcionalidades

### Cabecera
- Título "Mi Bodega / *Personal*" (Playfair Display)
- Contador de referencias (número grande + label "referencias")
- Icono de búsqueda → abre barra inline
- Icono de filtro/orden → abre panel completo

### Búsqueda
- Barra inline con campo de texto
- Sugerencias al escribir: región / vino / bodega / DO (con badge de tipo)
- Pills de filtros activos con botón ×
- Botón "Limpiar todo"
- Debounce 300ms

### Chips de filtro rápido (fila horizontal scrolleable)
- Todos · Tinto · Blanco · Rosado · Espumoso · Dulce
- Separador vertical
- ⭐ Favoritos · En stock

### Ordenación (selector inline)
- Añadidos recientemente (default)
- Nombre A–Z
- Bodega A–Z
- Añada ↑ (más antiguo)
- Añada ↓ (más reciente)
- Precio ↓
- Stock ↓

### Modos de vista
- **Grid** (2 columnas): imagen 130px, badge tipo, estrella favorito, stock badge en esquina
- **Lista** (1 columna): thumbnail 52×68, nombre + bodega + tipo + región, añada grande, stock pill

### Indicadores de stock en tarjeta
- `×6` — normal (crema)
- `×1` o `×2` — ámbar (stock bajo)
- `×0` — tachado + muted (sin stock)

### Agrupación (en vista lista)
- Separador con label + línea + count de referencias
- Opciones: Ninguno / Bodega / D.O.·Región / Añada / Tipo / Ubicación

### Panel de filtros completo
- Sección Tipo (chips)
- Sección Colección (Favoritos / En stock / Sin stock / Consumidos)
- Sección Añada (rango desde–hasta)
- Sección Agrupar por (chips)
- Sección Ordenar por (lista con check activo)
- Botón "Ver resultados (N)" + "Restablecer filtros"

### Estados vacíos
- **Sin resultados con filtros**: icono lupa con guion, texto descriptivo, botón "Limpiar filtros"
- **Bodega vacía**: icono copa, título, texto, botón "Escanear vino", hint "También puedes añadir manualmente"

### Estado de carga
- Skeletons grid 2 columnas con animación pulse
- Indicador "Actualizando bodega…" con spinner

---

## Decisiones de diseño

- El prototipo navegable está en el artifact publicado (sesión 2026-07-08)
- Vista grid es la default; la lista es mejor para colecciones grandes con agrupación
- El filtro de tipo permanece como chips horizontales (siempre visible); el resto va al panel
- Los chips "Favoritos" y "En stock" son accesos rápidos que también están en el panel completo
- La búsqueda no reemplaza la cabecera: se abre inline debajo del título
- La agrupación solo aplica en vista lista (en grid se vería fragmentada)

---

## Decisiones técnicas

- Filtrado del lado del cliente para `tipoFilter` (ya implementado)
- La búsqueda por texto va al servidor vía `listWines({ query })` con debounce 300ms (ya implementado)
- Los nuevos filtros (favorito, num_botellas > 0, rango añada) se añaden al query de Supabase en `useWines`
- La agrupación se hace en el cliente después de recibir los resultados
- El orden se envía al servidor como parámetro de `ORDER BY` en Supabase

---

## Pendiente

- Diseño congelado pendiente aprobación del prototipo
- Implementación en `Bodega.tsx` y `WineCard.tsx`
- Posible nuevo hook `useBodegaFilters` para encapsular estado de filtros

---

## Criterio de finalización

El usuario puede encontrar cualquier vino de su colección en menos de 5 segundos usando búsqueda, filtros o navegación visual.
