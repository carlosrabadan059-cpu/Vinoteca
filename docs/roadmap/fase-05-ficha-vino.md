# Fase 5 — Ficha del vino (WineDetail)

## Estado

✅ Completada (commit `4e61024`)

---

## Objetivo

Rediseñar la pantalla de detalle del vino con una jerarquía visual clara, acceso rápido a las acciones principales y visualización de la colección personal.

---

## Alcance

- Reescritura completa de `src/pages/WineDetail.tsx`
- Hero con imagen, identidad visual y datos clave
- Acciones rápidas: catar, consumir, editar
- Bloque de características técnicas adaptativo
- Bloque de notas personales
- Últimas catas (máximo 3)
- Panel colección (colapsable)
- Menú de opciones (web oficial, eliminar)

---

## Funcionalidades

### Jerarquía de bloques (orden fijo, congelado)
1. **Hero** 238px — imagen + gradiente + tipo / nombre / bodega / DO / añada
2. **Acciones** — Catar · Consumir · Editar
3. **Características** — uva, crianza, alcohol, temperatura de servicio (se oculta si vacía)
4. **Información del vino** — descripción + URL oficial de bodega (se oculta si vacía)
5. **Notas personales** — siempre visible (campo `notas` libre del usuario)
6. **Últimas catas** — máximo 3, con estrellas y estado vacío; botón "Ver historial completo" (pendiente de pantalla)
7. **Mi colección** — colapsable, cerrado por defecto; resumen en header (botellas, precio, ubicación, favorito)

### Componentes inline
- `Stars` — visualización de puntuación (readonly)
- `TastingCard` — tarjeta compacta de cata/consumo
- `ColeccionPanel` — panel colapsable de datos de colección personal

### Menú ⋯
- Web oficial de la bodega (abre URL externa)
- Eliminar vino (con confirmación)

---

## Decisiones de diseño

- Hero de 238px fijo: suficiente para imagen completa de etiqueta en portrait
- Características y descripción se ocultan si todos sus campos son null (no se muestran bloques vacíos)
- Colección colapsada por defecto: el dato relevante en el día a día es el vino, no el inventario
- "Ver historial completo" existe como botón pero no navega a ninguna pantalla todavía (se implementará en Fase 8)

---

## Decisiones técnicas

- Ninguna dependencia nueva — todo inline en el fichero de la página
- TypeScript limpio, build sin errores
- 397 inserciones, 253 eliminaciones respecto a la versión anterior

---

## Pendiente

- Pantalla "Historial completo de catas" para un vino — prevista en Fase 8

---

## Criterio de finalización

✅ El usuario puede ver toda la información del vino en una pantalla con jerarquía visual clara, acceder a sus catas y gestionar su colección personal.
