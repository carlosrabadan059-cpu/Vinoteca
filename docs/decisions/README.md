# Decisiones de diseño y técnicas

Este directorio registra las decisiones importantes del proyecto que no son evidentes desde el código.

Cada decisión sigue el formato ADR (Architecture Decision Record) ligero:
- **Contexto**: por qué surgió la decisión
- **Decisión**: qué se decidió
- **Consecuencias**: qué implica a futuro

---

## Índice

*(Se irán añadiendo decisiones a medida que se documenten)*

| ID | Título | Estado |
|----|--------|--------|
| — | — | — |

---

## Decisiones registradas en handoffs

Las siguientes decisiones están documentadas en los handoffs y en los documentos de fase, pero no se han migrado todavía a este directorio:

- **wine_uid**: SHA-256 de `nombre|bodega|añada` normalizados — idéntico en frontend y n8n
- **Sin QR**: eliminado en V1.3 porque los QR apuntan a AECOC, no a datos útiles del vino
- **Identidad vs enriquecimiento**: bloques separados, nunca se mezclan ni sobreescriben
- **Limitación F1/F2**: si OCR invierte nombre/bodega, no se corrige en V1.4 (documentado y aceptado)
- **Contratos V1.4 congelados**: `identify` y `enrich` no se modifican sin bump de versión
- **50 vinos al Sommelier**: `wineCollection` truncada para evitar tokens excesivos
- **ColeccionPanel cerrado por defecto**: el usuario ve el vino primero, el inventario es secundario
